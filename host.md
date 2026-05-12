# 🚀 Hosting LocatMed on Microsoft Azure: Deployment Guide

This guide provides a step-by-step roadmap for deploying the LocatMed ecosystem (Next.js, FastAPI OCR, and Chatbot RAG) to Microsoft Azure.

---

## 🏗️ Architecture Overview

The system consists of three primary layers interacting via REST APIs:

1.  **Frontend (Next.js):** Hosted on **Azure App Service**. It serves the UI and handles server-side logic (Server Actions/API Routes).
2.  **OCR Service (Python FastAPI):** Hosted on **Azure Container Apps** (recommended for GPU support or specialized dependencies) or **Azure App Service for Containers**.
3.  **Chatbot Backend (Azure OpenAI):** Leverages the **Azure OpenAI Service** for RAG capabilities, integrated directly into the Next.js server logic.
4.  **Database:** **Azure Database for MySQL** (flexible server) or **Turso (LibSQL)** depending on production preference.

---

## 🛠️ Recommended Azure Services

| Component | Azure Service | Why? |
| :--- | :--- | :--- |
| **Frontend** | Azure App Service (Web App) | Native Next.js support, easy scaling, and integrated SSL. |
| **OCR API** | Azure Container Apps | Best for Dockerized Python apps with specific ML dependencies (Donut model). |
| **AI/LLM** | Azure OpenAI Service | Enterprise-grade security and reliability for the RAG agent. |
| **Database** | Azure Database for MySQL | Fully managed MySQL compatible with Drizzle ORM. |
| **Registry** | Azure Container Registry (ACR) | To store the OCR Docker image. |

---

## 🚀 Deployment Steps

### 1. Deploy the Python OCR API
Since the OCR service uses heavy ML models (Transformers, Torch), containerization is the most stable path.

1.  **Containerize:** Create a `Dockerfile` in `services/medical-ocr/`:
    ```dockerfile
    FROM python:3.10-slim
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    COPY . .
    EXPOSE 8000
    CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
    ```
2.  **Build & Push:**
    ```bash
    az acr build --registry <YourRegistryName> --image medical-ocr:latest .
    ```
3.  **Deploy to Container Apps:**
    - Create a Container App in the Azure Portal.
    - Set the Ingress to **External** on Port **8000**.
    - **Note the URL:** (e.g., `https://medical-ocr.azurecontainerapps.io`)

### 2. Setup Azure OpenAI
1.  Go to the **Azure AI Studio**.
2.  Deploy a model (e.g., `gpt-4` or `gpt-35-turbo`).
3.  Copy the **Endpoint** and **API Key**.

### 3. Deploy the Next.js Frontend
1.  **Create App Service:**
    - Choose **Node.js 20 LTS** runtime.
    - Select **Linux** as the OS.
2.  **Configure Environment Variables:**
    - In the Portal: `Settings` > `Configuration` > `Application Settings`.
    - Add the variables listed in the next section.
3.  **Deploy via GitHub Actions:**
    - Azure provides a generated YAML file to push your code directly from GitHub to the Web App.

---

## ⚙️ Environment Variables (Production)

Set these in your Azure App Service "Environment Variables" section:

### Frontend (App Service)
- `NEXTAUTH_SECRET`: A long random string.
- `NEXTAUTH_URL`: `https://your-app-name.azurewebsites.net`
- `DB_HOST`: Your Azure MySQL endpoint.
- `DB_USER` / `DB_PASSWORD` / `DB_NAME`: Database credentials.
- `AZURE_OPENAI_API_KEY`: From Azure AI Studio.
- `AZURE_OPENAI_ENDPOINT`: From Azure AI Studio.
- `AZURE_OPENAI_DEPLOYMENT_NAME`: gpt-4o.
- `OCR_API_URL`: `https://medical-ocr.azurecontainerapps.io/ocr` (The internal or external URL of your FastAPI service).

### OCR API (Container Apps)
- `MODEL_PATH`: If storing the model in an Azure File Share (optional, recommended for fast startups).

---

## 🔗 Connecting Services

- **Next.js to OCR:** Ensure the `OCR_API_URL` environment variable points to the Azure Container App URL. Use the `/api/ocr` route as a proxy to avoid CORS issues.
- **Next.js to Database:** Azure MySQL usually requires SSL. Ensure your Drizzle configuration in `lib/db/index.ts` includes `{ ssl: { rejectUnauthorized: true } }`.

---

## 💰 Scaling & Cost Optimization

1.  **Scaling:**
    - **App Service:** Start with **B1** (Basic) for dev/test and move to **P1v3** (Premium) for production auto-scaling.
    - **Container Apps:** Set "Minimum Replicas" to `0` to save costs when the OCR service isn't being used (Serverless mode).
2.  **Costs:**
    - Use **Azure Reservations** for the database if you plan to run it long-term (up to 60% savings).
    - Use the **Azure Pricing Calculator** to estimate GPT-4 token costs.

---

## ⚠️ Common Errors & Fixes

- **Error: 504 Gateway Timeout (OCR):** Large ML models can take time to process. Increase the `http` timeout in the Next.js fetch call and ensure the Container App has enough CPU/Memory (minimum 2.0 vCPU / 4.0 GiB recommended).
- **Error: Database Connection Denied:** Check the **Networking** settings in Azure MySQL. You must "Allow Azure services and resources to access this server" or set up a VNet.
- **Error: Image Upload Too Large:** Next.js and Azure App Service have default body limits. Adjust `config.api.bodyParser` in your Next.js route if needed.

---

## 🏁 Final Step
Once deployed, update the `GEMINI.md` file in the repo to include the new production URLs for future AI agent maintenance.
