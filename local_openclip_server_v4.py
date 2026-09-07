from __future__ import annotations

import csv
import json
import mimetypes
import sqlite3
import sys
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

DEPENDENCY_ERROR: Exception | None = None

try:
    import open_clip
    import torch
    from PIL import Image, ImageDraw, ImageFont
except Exception as exc:  # Keep the server diagnosable when dependencies are missing.
    DEPENDENCY_ERROR = exc
    open_clip = None  # type: ignore[assignment]
    torch = None  # type: ignore[assignment]
    Image = None  # type: ignore[assignment]
    ImageDraw = None  # type: ignore[assignment]
    ImageFont = None  # type: ignore[assignment]


BASE_DIR = Path(__file__).resolve().parent
IMAGE_DIR = BASE_DIR / "images_AIgen"
GENERATED_DIR = BASE_DIR / "runtime_stickered_images"
DATA_STORAGE_DIR = BASE_DIR / "data_storage"
DATABASE_PATH = DATA_STORAGE_DIR / "a2_cmda_playtest.db"
ATTEMPT_CSV = BASE_DIR / "real_model_attempt_log.csv"
PROTOTYPE_HTML = BASE_DIR / "A2_CMDA_Game_V4.6_LocalDatabase.html"

MODEL_NAME = "ViT-B-32"
PRETRAINED = "laion2b_s34b_b79k"
APP_VERSION = "V4.6 Local Database Logging"
DB_LOCK = threading.Lock()

TEST_CASES = {
    "01_street_clock.png": {
        "source_label": "clock",
        "target_label": "taxi",
        "distractor_label": "street sign",
        "candidate_labels": ["clock", "watch", "tower clock", "taxi", "cab", "car", "vehicle", "street sign", "traffic light", "banana"],
    },
    "06_e1_ornate_plaza_clock.png": {
        "source_label": "clock",
        "target_label": "taxi",
        "distractor_label": "street sign",
        "candidate_labels": ["clock", "watch", "tower clock", "taxi", "cab", "car", "vehicle", "street sign", "traffic light", "banana"],
    },
    "02_coffee_mug.png": {
        "source_label": "mug",
        "target_label": "smartphone",
        "distractor_label": "bowl",
        "candidate_labels": ["mug", "cup", "bowl", "smartphone", "phone", "mobile phone", "device", "screen", "iPhone", "kettle", "dog"],
    },
    "03_dog.png": {
        "source_label": "dog",
        "target_label": "banana",
        "distractor_label": "cat",
        "candidate_labels": ["dog", "puppy", "cat", "banana", "fruit", "yellow object", "grass", "park", "laptop"],
    },
    "04_banana.png": {
        "source_label": "banana",
        "target_label": "dog",
        "distractor_label": "lemon",
        "candidate_labels": ["banana", "fruit", "lemon", "dog", "puppy", "pet", "animal", "cat", "kitchen", "table", "backpack"],
    },
    "05_backpack.png": {
        "source_label": "backpack",
        "target_label": "laptop",
        "distractor_label": "suitcase",
        "candidate_labels": ["backpack", "bag", "suitcase", "laptop", "computer", "screen", "classroom", "desk", "banana"],
    },
    "07_backpack_school_context.png": {
        "source_label": "backpack",
        "target_label": "laptop",
        "distractor_label": "suitcase",
        "candidate_labels": ["backpack", "bag", "suitcase", "laptop", "computer", "device", "screen", "school", "work", "study", "office", "desk", "banana"],
    },
    "08_ornate_wall_clock.png": {
        "source_label": "clock",
        "target_label": "taxi",
        "distractor_label": "street sign",
        "candidate_labels": ["clock", "watch", "tower clock", "taxi", "cab", "car", "street", "road", "street sign", "traffic light", "banana"],
    },
}


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def parse_hex_color(value: object, fallback: tuple[int, int, int]) -> tuple[int, int, int]:
    text = str(value or "").strip()
    if not text.startswith("#") or len(text) != 7:
        return fallback
    try:
        return tuple(int(text[index:index + 2], 16) for index in (1, 3, 5))
    except ValueError:
        return fallback


def get_font(size: int, font_weight: str = "900") -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    bold = str(font_weight) in {"700", "800", "900", "bold"}
    font_paths = [
        Path("C:/Windows/Fonts/arialbd.ttf") if bold else Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibrib.ttf") if bold else Path("C:/Windows/Fonts/calibri.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for font_path in font_paths:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)
    return ImageFont.load_default()


def build_prompts(label: str) -> list[str]:
    return [
        f"a photo of a {label}",
        f"a clear image of a {label}",
        f"the main object is a {label}",
    ]


def draw_sticker(
    image: Image.Image,
    text: str,
    size_percent: float,
    x_percent: float,
    y_percent: float,
    text_color: tuple[int, int, int],
    background_color: tuple[int, int, int],
    opacity_percent: float,
    rotation_degrees: float = 0,
    font_weight: str = "900",
) -> Image.Image:
    result = image.convert("RGBA")
    overlay = Image.new("RGBA", result.size, (0, 0, 0, 0))
    measure = ImageDraw.Draw(overlay)
    width, height = result.size

    text = text.strip()[:32] or "TEXT"
    size_percent = clamp(size_percent, 1, 100)
    opacity = int(clamp(opacity_percent, 10, 100) / 100 * 255)
    target_width = int(width * size_percent / 100)
    target_width = max(28, min(target_width, int(width * 0.96)))

    font_size = max(10, int(target_width / max(len(text), 4) * 1.42))
    font = get_font(font_size, font_weight)
    text_bbox = measure.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    padding_x = max(7, int(font_size * 0.42))
    padding_y = max(5, int(font_size * 0.28))
    sticker_width = min(width - 8, text_width + padding_x * 2)
    sticker_height = min(height - 8, text_height + padding_y * 2)

    center_x = int(width * clamp(x_percent, 0, 100) / 100)
    center_y = int(height * clamp(y_percent, 0, 100) / 100)

    radius = max(6, int(font_size * 0.18))
    border_width = max(2, int(font_size * 0.055))
    sticker_layer = Image.new("RGBA", (sticker_width + border_width * 2, sticker_height + border_width * 2), (0, 0, 0, 0))
    sticker_draw = ImageDraw.Draw(sticker_layer)
    sticker_draw.rounded_rectangle(
        [border_width, border_width, sticker_width + border_width, sticker_height + border_width],
        radius=radius,
        fill=(*background_color, opacity),
        outline=(12, 18, 32, opacity),
        width=border_width,
    )
    sticker_draw.text(
        (
            border_width + (sticker_width - text_width) / 2,
            border_width + (sticker_height - text_height) / 2 - int(font_size * 0.05),
        ),
        text,
        fill=(*text_color, opacity),
        font=font,
    )
    rotation = clamp(rotation_degrees, -90, 90)
    if rotation:
        sticker_layer = sticker_layer.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
    max_layer_width = max(12, width - 8)
    max_layer_height = max(12, height - 8)
    if sticker_layer.width > max_layer_width or sticker_layer.height > max_layer_height:
        scale = min(max_layer_width / sticker_layer.width, max_layer_height / sticker_layer.height)
        resized_size = (
            max(1, int(sticker_layer.width * scale)),
            max(1, int(sticker_layer.height * scale)),
        )
        sticker_layer = sticker_layer.resize(resized_size, Image.Resampling.LANCZOS)
    x = int(clamp(center_x - sticker_layer.width / 2, 4, width - sticker_layer.width - 4))
    y = int(clamp(center_y - sticker_layer.height / 2, 4, height - sticker_layer.height - 4))
    overlay.alpha_composite(sticker_layer, (x, y))
    return Image.alpha_composite(result, overlay).convert("RGB")


class OpenClipScorer:
    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            MODEL_NAME,
            pretrained=PRETRAINED,
            device=self.device,
        )
        self.tokenizer = open_clip.get_tokenizer(MODEL_NAME)
        self.model.eval()
        self.text_cache: dict[str, torch.Tensor] = {}
        self.baseline_cache: dict[str, dict[str, object]] = {}
        self.lock = threading.Lock()

    def encode_label(self, label: str) -> torch.Tensor:
        if label in self.text_cache:
            return self.text_cache[label]
        tokens = self.tokenizer(build_prompts(label)).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        encoded = features.mean(dim=0, keepdim=True)
        self.text_cache[label] = encoded
        return encoded

    def score_image(self, image_path: Path, labels: list[str]) -> dict[str, object]:
        with self.lock:
            image = self.preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(self.device)
            with torch.no_grad():
                image_features = self.model.encode_image(image)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

            text_features = torch.cat([self.encode_label(label) for label in labels], dim=0)
            logits = (100.0 * image_features @ text_features.T).squeeze(0).cpu().tolist()
            probabilities = torch.tensor(logits).softmax(dim=-1).tolist()

        probability_scores = {
            label: round(float(probability), 8)
            for label, probability in zip(labels, probabilities)
        }
        logit_scores = {
            label: round(float(logit), 6)
            for label, logit in zip(labels, logits)
        }
        top_prediction = max(probability_scores, key=probability_scores.get)
        return {
            "probabilities": probability_scores,
            "logits": logit_scores,
            "top_prediction": top_prediction,
        }

    def get_baseline(self, image_name: str) -> dict[str, object]:
        if image_name not in self.baseline_cache:
            case = TEST_CASES[image_name]
            self.baseline_cache[image_name] = self.score_image(
                IMAGE_DIR / image_name,
                case["candidate_labels"],
            )
        return self.baseline_cache[image_name]


SCORER: OpenClipScorer | None = None


def get_scorer() -> OpenClipScorer:
    global SCORER
    if DEPENDENCY_ERROR is not None:
        raise RuntimeError(
            "Missing Python dependencies. Please run: pip install -r requirements.txt. "
            f"Original error: {DEPENDENCY_ERROR}"
        )
    if SCORER is None:
        SCORER = OpenClipScorer()
    return SCORER


def dependency_status() -> dict[str, object]:
    dependencies_ready = DEPENDENCY_ERROR is None
    image_files = sorted(path.name for path in IMAGE_DIR.glob("*.png")) if IMAGE_DIR.exists() else []
    runtime_writable = True
    try:
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)
        probe = GENERATED_DIR / ".write_test"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
    except Exception:
        runtime_writable = False

    if dependencies_ready:
        torch_version = getattr(torch, "__version__", "unknown")
        openclip_version = getattr(open_clip, "__version__", "unknown")
        pillow_version = getattr(Image, "__version__", "unknown")
        cuda_available = bool(torch.cuda.is_available())
        device = "cuda" if cuda_available else "cpu"
    else:
        torch_version = ""
        openclip_version = ""
        pillow_version = ""
        cuda_available = False
        device = "unavailable"

    return {
        "app_version": APP_VERSION,
        "status": "ready" if dependencies_ready and PROTOTYPE_HTML.exists() and IMAGE_DIR.exists() else "needs_attention",
        "python": sys.version.split()[0],
        "executable": sys.executable,
        "model": MODEL_NAME,
        "pretrained": PRETRAINED,
        "device": device,
        "cuda_available": cuda_available,
        "dependencies_ready": dependencies_ready,
        "dependency_error": "" if dependencies_ready else str(DEPENDENCY_ERROR),
        "versions": {
            "torch": torch_version,
            "open_clip": openclip_version,
            "Pillow": pillow_version,
        },
        "prototype_html_exists": PROTOTYPE_HTML.exists(),
        "image_dir_exists": IMAGE_DIR.exists(),
        "image_count": len(image_files),
        "runtime_output_writable": runtime_writable,
        "database_path": str(DATABASE_PATH),
        "database_writable": database_writable(),
    }


def database_connection() -> sqlite3.Connection:
    DATA_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def init_database() -> None:
    with DB_LOCK:
        with database_connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    participant_id TEXT,
                    app_version TEXT,
                    language TEXT,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    user_agent TEXT
                );

                CREATE TABLE IF NOT EXISTS events (
                    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    participant_id TEXT,
                    event_type TEXT NOT NULL,
                    level_id TEXT,
                    timestamp TEXT NOT NULL,
                    payload_json TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS attempts (
                    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    participant_id TEXT,
                    trial_id TEXT,
                    event_type TEXT,
                    timestamp TEXT NOT NULL,
                    image_id TEXT,
                    sticker_text TEXT,
                    sticker_size REAL,
                    sticker_position TEXT,
                    sticker_color TEXT,
                    sticker_opacity REAL,
                    sticker_rotation REAL,
                    sticker_weight TEXT,
                    model_score_before TEXT,
                    model_score_after TEXT,
                    source_score_after REAL,
                    target_score_before REAL,
                    target_score_after REAL,
                    distractor_score_after REAL,
                    near_target_score_after REAL,
                    target_probability_delta REAL,
                    near_target_delta REAL,
                    target_logit_delta REAL,
                    generated_image TEXT,
                    scoring_mode TEXT,
                    scan_limit TEXT,
                    scan_limit_exceeded TEXT,
                    direct_target_used TEXT,
                    subject_obstruction TEXT,
                    subject_obstruction_ratio REAL,
                    obvious_white_sticker TEXT,
                    tutorial_completed TEXT,
                    tutorial_step_count TEXT,
                    tutorial_skipped TEXT,
                    tutorial_optional_controls_used TEXT,
                    time_spent INTEGER,
                    number_of_scans INTEGER,
                    submitted_result TEXT,
                    grade TEXT,
                    uncapped_grade TEXT,
                    composite REAL,
                    title_after_submit TEXT,
                    highest_title_level_after_submit TEXT,
                    payload_json TEXT NOT NULL
                );
                """
            )


def database_writable() -> bool:
    try:
        init_database()
        return DATABASE_PATH.exists()
    except Exception:
        return False


def current_timestamp() -> str:
    return datetime.now().isoformat(timespec="seconds")


def record_session(payload: dict[str, object], user_agent: str = "") -> dict[str, object]:
    init_database()
    session_id = str(payload.get("session_id") or payload.get("sessionId") or "").strip()
    if not session_id:
        raise ValueError("session_id is required")
    participant_id = str(payload.get("participant_id") or payload.get("participantId") or "").strip()
    language = str(payload.get("language") or "").strip()
    started_at = str(payload.get("started_at") or payload.get("startedAt") or current_timestamp())
    with DB_LOCK:
        with database_connection() as connection:
            connection.execute(
                """
                INSERT INTO sessions (session_id, participant_id, app_version, language, started_at, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    participant_id=excluded.participant_id,
                    language=excluded.language,
                    user_agent=excluded.user_agent
                """,
                (session_id, participant_id, APP_VERSION, language, started_at, user_agent),
            )
    return {"ok": True, "session_id": session_id, "database_path": str(DATABASE_PATH)}


def end_session(payload: dict[str, object]) -> dict[str, object]:
    init_database()
    session_id = str(payload.get("session_id") or payload.get("sessionId") or "").strip()
    if not session_id:
        raise ValueError("session_id is required")
    ended_at = str(payload.get("ended_at") or payload.get("endedAt") or current_timestamp())
    with DB_LOCK:
        with database_connection() as connection:
            connection.execute(
                "UPDATE sessions SET ended_at=? WHERE session_id=?",
                (ended_at, session_id),
            )
    insert_event({
        "type": "session_end",
        "session_id": session_id,
        "timestamp": ended_at,
    })
    return {"ok": True, "session_id": session_id, "ended_at": ended_at}


def insert_event(payload: dict[str, object]) -> None:
    with DB_LOCK:
        with database_connection() as connection:
            connection.execute(
                """
                INSERT INTO events (session_id, participant_id, event_type, level_id, timestamp, payload_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    str(payload.get("session_id", "")),
                    str(payload.get("participant_id", "")),
                    str(payload.get("type") or payload.get("event_type") or "event"),
                    str(payload.get("trial_id") or payload.get("level_id") or ""),
                    str(payload.get("timestamp") or current_timestamp()),
                    json.dumps(payload, ensure_ascii=False),
                ),
            )


def insert_attempt(payload: dict[str, object]) -> dict[str, object]:
    init_database()
    insert_event(payload)
    columns = [
        "session_id", "participant_id", "trial_id", "event_type", "timestamp", "image_id",
        "sticker_text", "sticker_size", "sticker_position", "sticker_color", "sticker_opacity",
        "sticker_rotation", "sticker_weight", "model_score_before", "model_score_after",
        "source_score_after", "target_score_before", "target_score_after", "distractor_score_after",
        "near_target_score_after", "target_probability_delta", "near_target_delta", "target_logit_delta",
        "generated_image", "scoring_mode", "scan_limit", "scan_limit_exceeded", "direct_target_used",
        "subject_obstruction", "subject_obstruction_ratio", "obvious_white_sticker", "tutorial_completed",
        "tutorial_step_count", "tutorial_skipped", "tutorial_optional_controls_used", "time_spent",
        "number_of_scans", "submitted_result", "grade", "uncapped_grade", "composite",
        "title_after_submit", "highest_title_level_after_submit"
    ]
    values = {column: payload.get(column, "") for column in columns}
    values["event_type"] = payload.get("type") or payload.get("event_type") or ""
    placeholders = ", ".join("?" for _ in columns)
    with DB_LOCK:
        with database_connection() as connection:
            cursor = connection.execute(
                f"""
                INSERT INTO attempts ({", ".join(columns)}, payload_json)
                VALUES ({placeholders}, ?)
                """,
                [values[column] for column in columns] + [json.dumps(payload, ensure_ascii=False)],
            )
    return {"ok": True, "attempt_id": cursor.lastrowid, "database_path": str(DATABASE_PATH)}


def append_attempt(row: dict[str, object]) -> None:
    fieldnames = [
        "timestamp",
        "participant_id",
        "session_id",
        "trial_id",
        "experiment_mode",
        "scan_index",
        "image",
        "sticker_text",
        "size_percent",
        "x_percent",
        "y_percent",
        "sticker_text_color",
        "sticker_background_color",
        "sticker_opacity_percent",
        "sticker_rotation_degrees",
        "sticker_font_weight",
        "stealth_score",
        "source_label",
        "target_label",
        "distractor_label",
        "baseline_top_prediction",
        "variant_top_prediction",
        "baseline_target_probability",
        "variant_target_probability",
        "target_probability_delta",
        "baseline_target_logit",
        "variant_target_logit",
        "target_logit_delta",
        "target_became_top",
        "generated_image",
    ]
    if ATTEMPT_CSV.exists():
        existing_header = ATTEMPT_CSV.read_text(encoding="utf-8-sig").splitlines()[0].split(",")
        if existing_header != fieldnames:
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            legacy_path = ATTEMPT_CSV.with_name(f"{ATTEMPT_CSV.stem}_legacy_{stamp}.csv")
            ATTEMPT_CSV.replace(legacy_path)

    file_exists = ATTEMPT_CSV.exists()
    with ATTEMPT_CSV.open("a", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({field: row.get(field, "") for field in fieldnames})


def score_attempt(payload: dict[str, object]) -> dict[str, object]:
    image_name = str(payload.get("image", ""))
    if image_name not in TEST_CASES:
        raise ValueError("Unknown image")

    sticker_text = str(payload.get("stickerText", "")).strip()[:32] or "TEXT"
    size_percent = clamp(float(payload.get("sizePercent", 22)), 1, 100)
    x_percent = clamp(float(payload.get("xPercent", 50)), 0, 100)
    y_percent = clamp(float(payload.get("yPercent", 72)), 0, 100)
    text_color_raw = str(payload.get("textColor", "#111827"))
    background_color_raw = str(payload.get("backgroundColor", "#ffffff"))
    opacity_percent = clamp(float(payload.get("opacityPercent", 92)), 10, 100)
    rotation_degrees = clamp(float(payload.get("rotationDegrees", 0)), -90, 90)
    font_weight = str(payload.get("fontWeight", "900"))
    text_color = parse_hex_color(text_color_raw, (17, 24, 39))
    background_color = parse_hex_color(background_color_raw, (255, 255, 255))

    case = TEST_CASES[image_name]
    labels = case["candidate_labels"]
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    output_name = f"{Path(image_name).stem}__runtime_{timestamp}.png"
    output_path = GENERATED_DIR / output_name

    base_image = Image.open(IMAGE_DIR / image_name).convert("RGB")
    stickered_image = draw_sticker(
        base_image,
        sticker_text,
        size_percent,
        x_percent,
        y_percent,
        text_color,
        background_color,
        opacity_percent,
        rotation_degrees,
        font_weight,
    )
    stickered_image.save(output_path)

    scorer = get_scorer()
    baseline = scorer.get_baseline(image_name)
    variant = scorer.score_image(output_path, labels)

    target_label = case["target_label"]
    source_label = case["source_label"]
    distractor_label = max(
        (label for label in labels if label not in {source_label, target_label}),
        key=lambda label: variant["probabilities"].get(label, 0),
    )
    baseline_target_probability = baseline["probabilities"][target_label]
    variant_target_probability = variant["probabilities"][target_label]
    baseline_target_logit = baseline["logits"][target_label]
    variant_target_logit = variant["logits"][target_label]

    result = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "participant_id": str(payload.get("participantId", "")).strip(),
        "session_id": str(payload.get("sessionId", "")).strip(),
        "trial_id": str(payload.get("trialId", "")).strip(),
        "experiment_mode": str(payload.get("experimentMode", "")).strip(),
        "scan_index": payload.get("scanIndex", ""),
        "image": image_name,
        "sticker_text": sticker_text,
        "size_percent": round(size_percent, 2),
        "x_percent": round(x_percent, 2),
        "y_percent": round(y_percent, 2),
        "sticker_text_color": text_color_raw,
        "sticker_background_color": background_color_raw,
        "sticker_opacity_percent": round(opacity_percent, 2),
        "sticker_rotation_degrees": round(rotation_degrees, 2),
        "sticker_font_weight": font_weight,
        "stealth_score": payload.get("stealthScore", ""),
        "source_label": source_label,
        "target_label": target_label,
        "distractor_label": distractor_label,
        "candidate_labels": labels,
        "baseline": baseline,
        "variant": variant,
        "baseline_top_prediction": baseline["top_prediction"],
        "variant_top_prediction": variant["top_prediction"],
        "baseline_target_probability": baseline_target_probability,
        "variant_target_probability": variant_target_probability,
        "target_probability_delta": round(
            variant_target_probability - baseline_target_probability,
            8,
        ),
        "baseline_target_logit": baseline_target_logit,
        "variant_target_logit": variant_target_logit,
        "target_logit_delta": round(variant_target_logit - baseline_target_logit, 6),
        "target_became_top": variant["top_prediction"] == target_label,
        "generated_image": f"/runtime_stickered_images/{output_name}",
    }
    append_attempt(result)
    return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return

    def send_json(self, status: int, data: dict[str, object]) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == "/":
            self.serve_file(PROTOTYPE_HTML)
            return
        if path == "/api/health":
            self.send_json(200, dependency_status())
            return
        if path == "/api/cases":
            self.send_json(
                200,
                {
                    "app_version": APP_VERSION,
                    "model": MODEL_NAME,
                    "pretrained": PRETRAINED,
                    "cases": TEST_CASES,
                },
            )
            return
        if path == "/api/database/status":
            self.send_json(
                200,
                {
                    "ok": database_writable(),
                    "database_path": str(DATABASE_PATH),
                    "database_exists": DATABASE_PATH.exists(),
                },
            )
            return
        requested = (BASE_DIR / path.lstrip("/")).resolve()
        if not str(requested).startswith(str(BASE_DIR.resolve())):
            self.send_error(403)
            return
        self.serve_file(requested)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            if parsed.path == "/api/score":
                result = score_attempt(payload)
            elif parsed.path == "/api/session/start":
                result = record_session(payload, self.headers.get("User-Agent", ""))
            elif parsed.path == "/api/log-attempt":
                result = insert_attempt(payload)
            elif parsed.path == "/api/session/end":
                result = end_session(payload)
            else:
                self.send_error(404)
                return
            self.send_json(200, result)
        except Exception as exc:
            self.send_json(400, {"error": str(exc)})

    def serve_file(self, path: Path) -> None:
        if not path.exists() or not path.is_file():
            self.send_error(404)
            return
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_server(port: int) -> None:
    init_database()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"A2_CMDA {APP_VERSION} running at http://127.0.0.1:{port}")
    print(f"Health check: http://127.0.0.1:{port}/api/health")
    if DEPENDENCY_ERROR is None:
        print("OpenCLIP will load on the first real scan.")
    else:
        print("Python dependencies need attention.")
        print(f"Original error: {DEPENDENCY_ERROR}")
    server.serve_forever()


def run_self_test() -> None:
    result = score_attempt(
        {
            "image": "01_street_clock.png",
            "stickerText": "TAXI",
            "sizePercent": 30,
            "xPercent": 50,
            "yPercent": 72,
        }
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        run_self_test()
    else:
        selected_port = 8776
        if "--port" in sys.argv:
            selected_port = int(sys.argv[sys.argv.index("--port") + 1])
        run_server(selected_port)
