# **Prompt for Claude (Backend Application Generator)**

**You are an expert backend engineer responsible for generating a complete backend application for my project.
Read all instructions carefully and follow them exactly.**

### **Goal**

Build a fully functional backend service that:

1. Handles **authentication** (signup, signin, logout)
2. Stores users and sessions in **Postgres**
3. Exposes all the routes described in the API specification file I will provide
4. Communicates with a **future Agent Service**, but for now uses a **mock agent layer**
5. Is production-ready, modular, and easy to extend later

### **Key Requirements**

* The backend must be a **separate service** from the Agent Service
* The backend must *not* contain any LLM logic
* All “chat” routes should call a **mock agent client**, which returns dummy responses until the real agent is built
* The codebase should follow clean architecture patterns
* Provide:

  * A folder structure
  * All necessary files
  * DB schema + migrations
  * Environment variable configuration
  * Instructions for running locally
  * Instructions for deployment
  * A test strategy or example tests

### **Mock Agent Layer**

Create an internal module such as `agentClient` with functions like:

```ts
await agentClient.sendMessage(userId, message)
```

This should return a hardcoded or simple placeholder response.

Later I will replace this with a real HTTP client that calls the Agent Service.

### **Input File**

I will now upload the **backend API specification file**.
Use it as the source of truth for all route definitions and request/response formats.

### **Deliverable**

Generate the entire backend application code as if you were delivering it to a real engineering team.
Follow best practices for correctness, structure, readability, and maintainability.
