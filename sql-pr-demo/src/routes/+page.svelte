<script lang="ts">
  import Database from "@tauri-apps/plugin-sql";

  let db: Database;
  let i = $state(0);
  async function initDatabase() {
    db = await Database.load("sqlite:test.db", {
      sqlite: { pragmas: { key: "encryption_key" } },
    });
    db.execute(
      "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)"
    )
      .then(() => {
        console.log("Table created");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  async function insertData() {
    const result = await db.execute("INSERT INTO test (name) VALUES (?)", [
      `test ${i}`,
    ]);
    i++;
    console.log(result);
  }
</script>

<button on:click={initDatabase}>Init Database</button>

<button on:click={insertData}>Insert Data</button>
