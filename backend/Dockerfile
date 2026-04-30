FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your files
COPY . .

# Add the current directory to the Python Path so it can find the 'app' module
ENV PYTHONPATH=/app

# Run the app
CMD ["python", "app/main.py"]
