FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (including build tools for any C extensions like psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code and migrations
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY data/ ./data/

EXPOSE 8000

# Default entrypoint for containers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
