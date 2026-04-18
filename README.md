# CPAN-212 Group10 — Movies App

## [Vercel Link](https://cpan-212-group10.vercel.app/login)

## Setup:

1. Install dependencies
    ```
    npm install
    ```
2. Create a `.env` file in the project root with the following content:
    ```
    CONNECTION_STRING=<your MongoDB connection URI>
    SESSION_SECRET=<anything>
    ```
3. Start the app
    ```
    npx nodemon server.js
    ```
4. Open the app at `http://localhost:8000`

5. To make sure we all have the same code formatting and avoid merge conflicts, please install .editorconfig extension for your IDE:

    5.1 This is the one for VS Code: [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

    5.2 Enable format document on save for VS Code:
    ```
    Open Settings: Press Ctrl + , (Windows/Linux) or Cmd + , (macOS).
    Search for Setting: Type "format on save" in the search bar.
    Enable: Check the box for Editor: Format On Save
    ```
6. To create branches and pull requests you can follow these guides:

    6.1 [Create Branches](https://medium.com/@akshaysen/clone-a-repository-create-a-branch-and-pull-new-changes-1bd732a812fb)

    6.2 [Open Pull Requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
