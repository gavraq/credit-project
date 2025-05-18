# Credit Project

This project is designed to manage and track credit-related operations using a modern Python backend and robust development practices.

## Project Structure

- `.gitignore` – Specifies files and directories to be ignored by Git
- `backend/` – Django backend application (core logic, models, API, admin)
- `frontend/` – React + Material-UI frontend application (created in Task 3)
- `tasks/` – Task Master task definitions and progress tracking
- `Documentation/` – Documentation for each project task and setup phase
- `requirements/` – PRD, schema, and requirements documentation
- `scripts/` – Scripts for setup, PRD parsing, and automation
- `.env.example` – Example environment configuration for backend

## Getting Started

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd credit-project
   ```
2. **Install Python dependencies**
   (Instructions will depend on your backend setup, e.g., using `uv`, `pip`, or `poetry`)

3. **Set up environment variables**
   - Copy `.env.example` to `.env` and update as needed

4. **Run the application**
   - To start the backend (Django):
     ```sh
     uv venv .venv
     source .venv/bin/activate
     uv pip install -r pyproject.toml
     python manage.py migrate
     python manage.py runserver
     ```
   - Frontend startup instructions are in the `frontend/` folder (see relevant README or documentation).

## Documentation

- The `Documentation/` folder contains detailed documentation for each major project task and milestone.
- See `Task_4_Documentation.md` for user/auth models and schema.
- See `Task_5_Documentation.md` for authentication and permissions implementation.
- See `Project_Sequencing.md` for a review of project task order, dependencies, and PRD alignment.

## Features Implemented

- User authentication with JWT (Simple JWT)
- Role-based permissions and enforcement
- Admin UI for user, role, and permission management
- Task-based project management and documentation

## UV Usage & Workflow

This project uses [UV](https://github.com/astral-sh/uv) for Python dependency and environment management. All Python onboarding, dependency installation, and environment updates should use uv commands and the `pyproject.toml`/`uv.lock` files. Do not use pip, requirements.txt, or poetry unless explicitly required.

### Common Commands

- **Create and activate a virtual environment**
  ```sh
  uv venv
  source .venv/bin/activate
  ```
- **Install all dependencies (from lock file)**
  ```sh
  uv pip install -r pyproject.toml
  ```
- **Add a new dependency**
  ```sh
  uv add <package-name>
  ```
- **Update the lock file after editing pyproject.toml**
  ```sh
  uv pip compile pyproject.toml
  ```
- **Run scripts**
  ```sh
  uv venv exec python <script.py>
  ```

See the [UV documentation](https://github.com/astral-sh/uv) for more details.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
