"use client";

import { useState, useEffect, useRef } from "react";
import { client } from "../lib/client";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load todos on mount
  async function loadTodos() {
    try {
      setLoading(true);
      const response = await client.api.todos.get();
      if (response.data) {
        setTodos(response.data.todos);
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Create new todo
  async function createTodo() {
    if (!newTodoText.trim()) return;

    try {
      const response = await client.api.todos.post({
        text: newTodoText.trim(),
      });

      if (response.data?.todo) {
        setTodos([...todos, response.data.todo]);
        setNewTodoText("");
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  }

  // Toggle todo completion
  async function toggleTodo(todo: Todo) {
    try {
      const response = await client.api.todos({ id: todo.id }).patch({
        completed: !todo.completed,
      });

      if (response.data?.todo) {
        const index = todos.findIndex((t) => t.id === todo.id);
        if (index !== -1) {
          const newTodos = [...todos];
          newTodos[index] = response.data.todo;
          setTodos(newTodos);
        }
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  }

  // Delete todo
  async function deleteTodo(id: string) {
    try {
      await client.api.todos({ id }).delete();
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }

  // Start editing
  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Save edit
  async function saveEdit() {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await client.api.todos({ id: editingId }).patch({
        text: editText.trim(),
      });

      if (response.data?.todo) {
        const index = todos.findIndex((t) => t.id === editingId);
        if (index !== -1) {
          const newTodos = [...todos];
          newTodos[index] = response.data.todo;
          setTodos(newTodos);
        }
      }
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  }

  // Cancel edit
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  // Load todos when component mounts
  useEffect(() => {
    loadTodos();
  }, []);

  // Handle Enter key for creating todos
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      createTodo();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">
            Todo List
          </h1>

          {/* Add Todo Form */}
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
            <button
              onClick={createTodo}
              disabled={!newTodoText.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add
            </button>
          </div>

          {/* Loading State */}
          {loading && todos.length === 0 ? (
            <div className="text-center text-slate-500 py-8">Loading todos...</div>
          ) : todos.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No todos yet. Add one above to get started!
            </div>
          ) : (
            /* Todo List */
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />

                  {/* Todo Text or Edit Input */}
                  {editingId === todo.id ? (
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 cursor-pointer ${
                          todo.completed
                            ? "line-through text-slate-500"
                            : "text-slate-800"
                        }`}
                        onDoubleClick={() => startEdit(todo)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            startEdit(todo);
                          }
                        }}
                      >
                        {todo.text}
                      </span>
                      <button
                        onClick={() => startEdit(todo)}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Stats */}
          {todos.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600 text-center">
              {todos.filter((t) => !t.completed).length} of {todos.length} tasks
              remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
}