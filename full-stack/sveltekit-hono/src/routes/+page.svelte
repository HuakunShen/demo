<script lang="ts">
  import { client } from "$lib/client";

  interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }

  let todos = $state<Todo[]>([]);
  let newTodoText = $state("");
  let loading = $state(false);
  let editingId = $state<string | null>(null);
  let editText = $state("");
  let editInputElement = $state<HTMLInputElement | null>(null);

  // Load todos on mount
  async function loadTodos() {
    try {
      loading = true;
      const response = await client.api.todos.$get();
      if (response.ok) {
        const data = await response.json();
        todos = data.todos;
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      loading = false;
    }
  }

  // Create new todo
  async function createTodo() {
    if (!newTodoText.trim()) return;
    
    try {
      const response = await client.api.todos.$post({
        json: {
          text: newTodoText.trim(),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.todo) {
          todos = [...todos, data.todo];
          newTodoText = "";
        }
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  }

  // Toggle todo completion
  async function toggleTodo(todo: Todo) {
    try {
      const response = await client.api.todos[":id"].$patch({
        param: { id: todo.id },
        json: {
          completed: !todo.completed,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.todo) {
          const index = todos.findIndex((t) => t.id === todo.id);
          if (index !== -1) {
            todos[index] = data.todo;
            todos = [...todos]; // Trigger reactivity
          }
        }
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  }

  // Delete todo
  async function deleteTodo(id: string) {
    try {
      const response = await client.api.todos[":id"].$delete({
        param: { id },
      });
      
      if (response.ok) {
        todos = todos.filter((t) => t.id !== id);
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }

  // Start editing
  function startEdit(todo: Todo) {
    editingId = todo.id;
    editText = todo.text;
  }

  // Auto-focus edit input when editing starts
  $effect(() => {
    if (editingId && editInputElement) {
      editInputElement.focus();
    }
  });

  // Save edit
  async function saveEdit() {
    if (!editingId || !editText.trim()) {
      editingId = null;
      return;
    }

    try {
      const response = await client.api.todos[":id"].$patch({
        param: { id: editingId },
        json: {
          text: editText.trim(),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.todo) {
          const index = todos.findIndex((t) => t.id === editingId);
          if (index !== -1) {
            todos[index] = data.todo;
            todos = [...todos];
          }
        }
      }
      editingId = null;
      editText = "";
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  }

  // Cancel edit
  function cancelEdit() {
    editingId = null;
    editText = "";
  }

  // Load todos when component mounts
  $effect(() => {
    loadTodos();
  });

  // Handle Enter key for creating todos
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      createTodo();
    }
  }
</script>

<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4">
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <h1 class="text-4xl font-bold text-slate-800 mb-8 text-center">
        Todo List
      </h1>

      <!-- Add Todo Form -->
      <div class="mb-6 flex gap-2">
        <input
          type="text"
          bind:value={newTodoText}
          onkeydown={handleKeyDown}
          placeholder="Add a new todo..."
          class="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onclick={createTodo}
          disabled={!newTodoText.trim() || loading}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Add
        </button>
      </div>

      <!-- Loading State -->
      {#if loading && todos.length === 0}
        <div class="text-center text-slate-500 py-8">Loading todos...</div>
      {:else if todos.length === 0}
        <div class="text-center text-slate-400 py-8">
          No todos yet. Add one above to get started!
        </div>
      {:else}
        <!-- Todo List -->
        <ul class="space-y-2">
          {#each todos as todo (todo.id)}
            <li
              class="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <!-- Checkbox -->
              <input
                type="checkbox"
                checked={todo.completed}
                onchange={() => toggleTodo(todo)}
                class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />

              <!-- Todo Text or Edit Input -->
              {#if editingId === todo.id}
                <input
                  type="text"
                  bind:this={editInputElement}
                  bind:value={editText}
                  onkeydown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  class="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onclick={saveEdit}
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onclick={cancelEdit}
                  class="px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              {:else}
                <span
                  class={`flex-1 cursor-pointer ${
                    todo.completed
                      ? "line-through text-slate-500"
                      : "text-slate-800"
                  }`}
                  ondblclick={() => startEdit(todo)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startEdit(todo);
                    }
                  }}
                >
                  {todo.text}
                </span>
                <button
                  onclick={() => startEdit(todo)}
                  class="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit
                </button>
                <button
                  onclick={() => deleteTodo(todo.id)}
                  class="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <!-- Stats -->
      {#if todos.length > 0}
        <div class="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600 text-center">
          {todos.filter((t) => !t.completed).length} of {todos.length} tasks
          remaining
        </div>
      {/if}
    </div>
  </div>
</div>
