# reMarkidian

reMarkidian is a synchronization and knowledge-management app that connects your **reMarkable tablet**, **Obsidian vaults**, and **GitHub repositories** into a single automated workflow.

* 📝 **Capture Notes** on your reMarkable.
* 🔄 **Sync & Convert** to Markdown for Obsidian.
* 📂 **Organize** across multiple vaults.
* 🚀 **Auto-publish** to one or more GitHub repos.
* 📊 **View logs, metrics, and sync history** in a modern, dark-themed dashboard.

---

## ✨ Features

* **reMarkable Sync** – scheduled or manual sync (cron + “Sync Now” button).
* **Markdown Conversion** – all synced notes converted into Obsidian-friendly `.md` files.
* **Multiple Vaults** – add/edit/remove vaults dynamically (GitHub repo + token).
* **GitHub Integration** – auto-sync to multiple repositories.
* **Logging & Notifications** – view sync logs in-app, plus Discord notifications.
* **Markdown Viewer** – preview synced Obsidian vaults directly in the app.
* **Extensible** – optional AI/ML processing (summaries, diagrams, tagging).

---

## 🏗️ Architecture

* **Frontend:** React (dark theme, technology-inspired UI).
* **Backend:** Node.js (Express).
* **Database:** SQLite (for configs, vaults, sync history).
* **Containerization:** Docker + Docker Compose.
* **Deployment Targets:** Local (Windows dev) or Raspberry Pi (production-like).

```
[reMarkable Tablet] → [Sync Engine] → [Markdown Converter] → [Vault Manager] → [GitHub Repos]
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 18
* npm or yarn
* Docker + Docker Compose (for containerized runs)
* A reMarkable developer account + API token
* GitHub access token(s) with `repo` scope

---

### 🔹 Local Development (Windows)

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/reMarkidian.git
   cd reMarkidian
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start backend:

   ```bash
   cd backend
   npm run dev
   ```

4. Start frontend:

   ```bash
   cd frontend
   npm run dev
   ```

---

### 🔹 Remote Development (Raspberry Pi + Docker)

1. Install Docker + Compose on Pi:

   ```bash
   curl -sSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   sudo apt install docker-compose -y
   ```

2. Clone repo to Pi:

   ```bash
   git clone https://github.com/your-username/reMarkidian.git
   cd reMarkidian
   ```

3. Start app with Docker:

   ```bash
   docker-compose up -d --build
   ```

4. Access UI at:

   ```
   http://<raspberry-pi-ip>:3000
   ```

---

## ⚙️ Configuration

* **Vaults**: Add vaults via UI (Vault Name, GitHub Repo, Token).
* **Sync**: Configure CRON schedule or run manually.
* **Notifications**: Enable Discord webhook in settings.

Config is persisted in SQLite inside the Docker volume.

---

## 📂 Project Structure

```
reMarkidian/
├── backend/        # Node.js API + sync engine
├── frontend/       # React web app (dark UI)
├── docker/         # Dockerfiles + compose configs
├── docs/           # Documentation
└── data/           # SQLite DB + synced vaults
```

---

## 📊 Logs & Monitoring

* View detailed logs in-app (filter: sync, GitHub, AI/ML).
* Logs stored persistently in `/data/logs`.
* Discord notifications can be enabled for success/failure events.

---

## 🛠️ Development Workflow

* Use **VSCode Remote SSH** if working directly on Pi.
* Use **slash workflows** (Cline) for repeatable dev tasks.
* Rules & workflows are defined in `/docs/cline/`.

---

## 🔮 Roadmap

* [ ] AI/ML note enrichment (summaries, diagrams, tags).
* [ ] Web-based Obsidian-style graph view.
* [ ] Multi-user support.
* [ ] Mobile companion app.

---

## 🤝 Contributing

Pull requests welcome! Please:

1. Fork the repo.
2. Create a feature branch.
3. Submit PR with clear description.

---

## 📜 License

MIT License – see [LICENSE](LICENSE).
