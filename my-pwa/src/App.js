
import { createElement as h, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pwa-todo-list";
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const starterTodos = [
  { id: 1, text: "Plan the day", done: true },
  { id: 2, text: "Review project goals", done: false },
  { id: 3, text: "Complete task update", done: false },
];

function readStoredTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return starterTodos;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : starterTodos;
  } catch {
    return starterTodos;
  }
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function formatRemainingTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / SECOND));
  const days = Math.floor(totalSeconds / (DAY / SECOND));
  const hours = Math.floor((totalSeconds % (DAY / SECOND)) / (HOUR / SECOND));
  const minutes = Math.floor((totalSeconds % (HOUR / SECOND)) / (MINUTE / SECOND));
  const seconds = totalSeconds % (MINUTE / SECOND);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function toDateTimeLocalValue(timestamp) {
  const date = new Date(timestamp);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function App() {
  const [todos, setTodos] = useState(readStoredTodos);
  const [text, setText] = useState("");
  const [dueAtInput, setDueAtInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now);
  const [nextId, setNextId] = useState(Date.now);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [installed, setInstalled] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
  );
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), SECOND);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const media = window.matchMedia("(display-mode: standalone)");
    const handleDisplayMode = (event) => {
      setInstalled(event.matches);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    media.addEventListener("change", handleDisplayMode);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      media.removeEventListener("change", handleDisplayMode);
    };
  }, []);

  const visibleTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((todo) => !todo.done);
    }

    if (filter === "completed") {
      return todos.filter((todo) => todo.done);
    }

    return todos;
  }, [filter, todos]);

  const remaining = todos.filter((todo) => !todo.done).length;

  const addTodo = (event) => {
    event.preventDefault();

    const trimmedText = text.trim();
    const dueAt = new Date(dueAtInput).getTime();
    if (!trimmedText) {
      event.currentTarget.elements.task.setCustomValidity("Enter a task name.");
      event.currentTarget.elements.task.reportValidity();
      return;
    }

    if (!dueAtInput || !Number.isFinite(dueAt) || dueAt <= now) {
      event.currentTarget.elements.deadline.setCustomValidity(
        "Choose a deadline in the future."
      );
      event.currentTarget.elements.deadline.reportValidity();
      return;
    }

    setTodos((current) => [
      ...current,
      {
        id: nextId,
        text: trimmedText,
        done: false,
        createdAt: now,
        dueAt,
      },
    ]);
    setNextId((current) => current + 1);
    setText("");
    setDueAtInput("");
  };

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const removeTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return h(
    "main",
    { className: "app-shell" },
    h(
      "div",
      { className: "todo-app" },
      h(
        "header",
        { className: "topbar" },
        h(
          "div",
          { className: "brand" },
          h("img", {
            className: "app-icon",
            src: "/icons/icon-192.png",
            alt: "TaskFlow app icon",
            width: "56",
            height: "56",
          }),
         
        ),
        h(
          "div",
          { className: "status-group" },
          h(
            "span",
            { className: `status-badge ${online ? "online" : "offline"}` },
            online ? "Online" : "Offline"
          ),
          !installed &&
            installPrompt &&
            h(
              "button",
              {
                type: "button",
                className: "install-button",
                onClick: handleInstall,
              },
              "Install app"
            )
        )
      ),
      h("p", { className: "eyebrow" }, "PWA TODO LIST"),
      h(
        "form",
        { className: "todo-form", onSubmit: addTodo },
        
        h("input", {
          type: "text",
          name: "task",
          value: text,
          onChange: (event) => {
            event.currentTarget.setCustomValidity("");
            setText(event.target.value);
          },
          placeholder: "Add a task...",
          "aria-label": "Add a task",
          required: true,
          maxLength: 120,
        }),
        h("label", { className: "deadline-field" },
          h("span", null, "Complete by"),
          h("input", {
            type: "datetime-local",
            name: "deadline",
            value: dueAtInput,
            min: toDateTimeLocalValue(now + MINUTE),
            onChange: (event) => {
              event.currentTarget.setCustomValidity("");
              setDueAtInput(event.target.value);
            },
            "aria-label": "Task deadline date and time",
            required: true,
          })
        ),
        h("button", { type: "submit" }, "Add")
      ),
      h(
        "section",
        { className: "summary" },
        h(
          "div",
          null,
          h("strong", null, todos.length),
          h("span", null, "Total")
        ),
        h(
          "div",
          null,
          h("strong", null, remaining),
          h("span", null, "Remaining")
        ),
        h(
          "div",
          null,
          h("strong", null, todos.length - remaining),
          h("span", null, "Done")
        )
      ),
      h(
        "nav",
        { className: "filters", "aria-label": "Todo filters" },
        filters.map((item) =>
          h(
            "button",
            {
              key: item.key,
              type: "button",
              className: filter === item.key ? "active" : "",
              onClick: () => setFilter(item.key),
            },
            item.label
          )
        )
      ),
      h(
        "ul",
        { className: "todo-list" },
        visibleTodos.length === 0
          ? h("li", { className: "empty-state" }, "No tasks in this view.")
          : visibleTodos.map((todo) =>
              h(
                "li",
                {
                  key: todo.id,
                  className: `todo-row${todo.done ? " done" : ""}`,
                },
                h(
                  "div",
                  { className: "todo-content" },
                  h(
                    "label",
                    { className: "todo-item" },
                    h("input", {
                      type: "checkbox",
                      checked: todo.done,
                      onChange: () => toggleTodo(todo.id),
                    }),
                    h("span", null, todo.text)
                  ),
                  todo.dueAt && Number.isFinite(new Date(todo.dueAt).getTime())
                    ? (() => {
                        const deadline = new Date(todo.dueAt).getTime();
                        const start = Number(todo.createdAt);
                        const totalDuration = deadline - start;
                        const remainingDuration = deadline - now;
                        const progress =
                          totalDuration > 0 && Number.isFinite(start)
                            ? Math.max(
                                0,
                                Math.min(100, (remainingDuration / totalDuration) * 100)
                              )
                            : 0;
                        const isOverdue = remainingDuration <= 0 && !todo.done;

                        return h(
                          "div",
                          { className: "todo-deadline" },
                          h(
                            "div",
                            { className: "deadline-details" },
                            h(
                              "span",
                              { className: isOverdue ? "deadline-time overdue" : "deadline-time" },
                              todo.done
                                ? "Completed"
                                : isOverdue
                                  ? "Overdue"
                                  : `${formatRemainingTime(remainingDuration)} left`
                            ),
                            h(
                              "time",
                              {
                                className: "deadline-date",
                                dateTime: new Date(deadline).toISOString(),
                              },
                              `Due ${formatDateTime(deadline)}`
                            )
                          ),
                          h(
                            "div",
                            {
                              className: `progress-track${isOverdue ? " overdue" : ""}`,
                              role: "progressbar",
                              "aria-label": `Time remaining for ${todo.text}`,
                              "aria-valuemin": 0,
                              "aria-valuemax": 100,
                              "aria-valuenow": todo.done ? 100 : Math.round(progress),
                            },
                            h("div", {
                              className: "progress-fill",
                              style: { width: `${todo.done ? 100 : progress}%` },
                            })
                          )
                        );
                      })()
                    : h(
                        "div",
                        { className: "todo-deadline no-deadline" },
                        h("span", null, "No deadline set")
                      )
                ),
                h(
                  "div",
                  { className: "todo-actions" },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "delete-button",
                      onClick: () => removeTodo(todo.id),
                      "aria-label": `Delete ${todo.text}`,
                    },
                    "Delete"
                  )
                )
              )
            )
      )
    )
  );
}
