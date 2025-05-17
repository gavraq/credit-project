# Credit Project

This project is designed to manage and track credit-related operations using a modern Python backend and robust development practices.

## Project Structure

- `.gitignore` – Specifies files and directories to be ignored by Git
- `scripts/` – Contains scripts for setup, PRD, and automation
- `tasks/` – Task Master task definitions and progress tracking
- `UI-examples/` – Frontend/UI example components
- `.env.example` – Example environment configuration

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
   - Backend and frontend startup instructions will be added as the project evolves

## UV Usage & Workflow

This project uses [UV](https://github.com/astral-sh/uv) for Python dependency management and fast installs.

### Common Commands

- **Install dependencies**
  ```sh
  uv pip install -r requirements.txt
  ```
- **Add a dependency**
  ```sh
  uv pip install <package-name>
  ```
- **Update dependencies**
  ```sh
  uv pip install --upgrade <package-name>
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
