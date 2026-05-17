# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /repo
COPY apps/shell-api/pyproject.toml ./apps/shell-api/pyproject.toml
WORKDIR /repo/apps/shell-api
RUN pip install .

COPY apps/shell-api/app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
