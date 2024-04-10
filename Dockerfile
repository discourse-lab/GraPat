FROM python:3.11

WORKDIR /app

# copy the dependencies file to the working directory
COPY requirements.txt .
RUN pip install -U pip wheel setuptools
RUN pip install -r requirements.txt

COPY grapat grapat
COPY static static
COPY templates templates
COPY app.py app.py

EXPOSE 8080
ENTRYPOINT python app.py --port 8080
