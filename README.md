# Cross-Modal Disguise Agent

An educational web game prototype for exploring how text embedded inside images can influence multimodal AI predictions.

Players edit one text sticker on an image, run a local OpenCLIP model, and observe whether the model prediction moves from a source category toward a target category while the image remains readable to humans.

## Features

- Multi-page game flow
- Tutorial, easy, and advanced mission groups
- One draggable text sticker per mission
- Sticker controls for text, size, position, colour, opacity, rotation, and font weight
- Local OpenCLIP scoring through a Python server
- Mission-specific candidate labels and grading rules
- Rule-based stealth score
- Bilingual Chinese / English interface
- Local CSV logging for study sessions

## Model

The local scoring pipeline uses OpenCLIP:

```text
Model: ViT-B-32
Pretrained weights: laion2b_s34b_b79k
```

Each mission uses a fixed closed set of candidate labels. Confidence values shown in the interface are closed-set softmax probabilities converted to rounded percentages.

## Project Structure

```text
.
├── index.html
├── A2_CMDA_Game_V4.4_Modular.html
├── local_openclip_server_v4.py
├── start_A2_CMDA_V4_real_model_server.ps1
├── requirements.txt
├── styles/
├── data/
├── scripts/
└── images_AIgen/
```

## Local Setup

Install dependencies:

```powershell
pip install -r requirements.txt
```

Start the local server:

```powershell
cd "path\to\this\repository"
python .\local_openclip_server_v4.py
```

Open the game:

```text
http://127.0.0.1:8774/
```

The first scan may take longer because the OpenCLIP model is loaded on the first request.

## Static Preview

`index.html` can be opened directly for a static interface preview. Real model scoring requires the local Python server.

## Runtime Outputs

The local server may generate:

```text
real_model_attempt_log.csv
runtime_stickered_images/
```

These files are ignored by Git.

## Test Environment

The prototype was tested locally with:

```text
CPU: 11th Gen Intel Core i7-1165G7
RAM: 16 GB
Python: 3.10.7
PyTorch: 2.13.0 CPU
OpenCLIP: 3.3.0
Pillow: 10.0.1
CUDA: not used
```

## Link

```text
https://github.com/CloudClockCC/Cross-Modal-Disguise-Agent
```
