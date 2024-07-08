<!-- eslint-disable no-alert -->
<script lang="ts" setup>
import { OnClickOutside } from '@vueuse/components'
import { useMagicKeys, useWindowSize } from '@vueuse/core'
import ConfettiExplosion from 'vue-confetti-explosion'
import { nextTick, ref } from 'vue'

const visible = ref(false)
const { width, height } = useWindowSize()

async function explode() {
  visible.value = false
  await nextTick()
  visible.value = true
}
const { escape, meta_backspace, meta_i, meta_e /* keys you want to monitor */ } = useMagicKeys()

watch(escape, (v) => {
  if (v)
    handleEscapeKey()
})

watch(meta_backspace, (v) => {
  if (v)
    clearBoard()
})
watch(meta_i, (v) => {
  if (v)
    importJson()
})

watch(meta_e, (v) => {
  if (v)
    exportJson()
})

watch(meta_e, (v) => {
  if (v)
    exportJson()
})

function generateUuid() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function init(): Board {
  return {
    title: 'Kanban',
    titleEditable: false,
    columns: {
      [generateUuid()]: {
        title: 'To do',
        tasks: {
          [generateUuid()]: { order: 0, title: 'Export my board as JSON', content: 'Use the export button to export your board. You can then use the import button to import it back in and continue using it later.', complete: false },
        },
      },
      [generateUuid()]: {
        title: 'In progress',
        tasks: {
          [generateUuid()]: { order: 0, title: 'Trying out this Kanban project', content: '', complete: false },
        },
      },
      [generateUuid()]: {
        title: 'Done 🚀',
        tasks: {
        },
      },
    },
  }
}

export interface Task {
  order: number
  title: string
  content: string
  contentEditable?: boolean
  titleEditable?: boolean
  complete: boolean
}

export interface Column {
  title: string
  titleEditable?: boolean
  tasks: Record<string, Task>
}

export interface Board {
  title: string
  titleEditable?: boolean
  columns: Record<string, Column>
}

export interface BoardJson {
  title: string
  columns: Record<string, ColumnJson>
}

export interface ColumnJson {
  title: string
  tasks: Record<string, TaskJson>
}

export type TaskJson = Omit<Task, 'contentEditable' | 'titleEditable' | 'order'>

const board = useState('board', init)

function deleteColumn(columnId: string) {
  const result = confirm('Are you sure you want to delete this column?')
  if (result) {
    delete board.value.columns[columnId]
  }
}

function addColumn() {
  const title = prompt('Enter the title of the column')
  if (title) {
    const columnId = generateUuid()
    board.value.columns[columnId] = {
      title,
      tasks: {},
      titleEditable: false,
    }
    snapToEndOfColumnContainer(columnId)
  }
}

function deleteTask(columnId: string, taskId: string) {
  const result = confirm('Are you sure you want to delete this task?')
  if (result) {
    delete board.value.columns[columnId].tasks[taskId]
  }
}

function addTask(columnId: string) {
  const title = prompt('Enter the title of the task')
  if (title) {
    const taskId = generateUuid()
    board.value.columns[columnId].tasks[taskId] = {
      order: Object.keys(board.value.columns[columnId].tasks).length + 1,
      title,
      content: '',
      complete: false,
    }
  }
}

function setColumnNotEditable(columnId: string) {
  board.value.columns[columnId].titleEditable = false
  for (const task of Object.values(board.value.columns[columnId].tasks)) {
    task.contentEditable = false
    task.titleEditable = false
  }
}

function handleColumnTitleReturn(columnId: string) {
  if (!board.value.columns[columnId].title) {
    board.value.columns[columnId].title = 'Untitled column'
  }
  board.value.columns[columnId].titleEditable = false
}
function handleBoardTitleReturn() {
  if (!board.value.title) {
    board.value.title = 'Untitled board'
  }
  board.value.titleEditable = false
}

function importJson() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as BoardJson
          board.value.title = data.title
          board.value.columns = {}
          for (const [columnId, column] of Object.entries(data.columns)) {
            board.value.columns[columnId] = {
              title: column.title,
              tasks: {},
            }
            let order = 0
            for (const [taskId, task] of Object.entries(column.tasks)) {
              board.value.columns[columnId].tasks[taskId] = {
                order,
                title: task.title,
                content: task.content,
                complete: task.complete,
              }
              order++
            }
          }
        }
        catch (error) {
          alert('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

function exportJson() {
  let boardJson: BoardJson | null = null
  boardJson = {
    title: board.value.title,
    columns: {} as Record<string, ColumnJson>,
  }

  for (const [columnId, column] of Object.entries(board.value.columns)) {
    boardJson.columns[columnId] = {
      title: column.title,
      tasks: {} as Record<string, TaskJson>,
    }

    for (const [taskId, task] of Object.entries(column.tasks)) {
      boardJson.columns[columnId].tasks[taskId] = {
        title: task.title,
        content: task.content,
        complete: task.complete,
      }
    }
  }
  if (boardJson) {
    const data = JSON.stringify(boardJson)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${board.value.title}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

function clearBoard() {
  const result = confirm('Are you sure you want to clear the board?')
  if (result) {
    board.value.columns = {}
  }
}

const taskDragged = ref<{ columnId: string, taskId: string } | null>(null)

function startDragTask(_event: DragEvent, { columnId, taskId }: { columnId: string, taskId: string }) {
  taskDragged.value = { columnId, taskId }
}

function onDrop(_event: DragEvent, columnId: string) {
  if (taskDragged.value) {
    const { columnId: fromColumnId, taskId } = taskDragged.value
    const task = board.value.columns[fromColumnId].tasks[taskId]
    board.value.columns[columnId].tasks[taskId] = task
    if (fromColumnId !== columnId) {
      delete board.value.columns[fromColumnId].tasks[taskId]
    }
    taskDragged.value = null
  }
}

const columnContainer = ref<HTMLElement | null>(null)

async function snapToEndOfColumnContainer(columnId: string) {
  await nextTick()
  document.getElementById(`column-${columnId}`)?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

async function focusElement(id: string) {
  await nextTick()
  document.getElementById(id)?.focus()
}

function handleEscapeKey() {
  board.value.titleEditable = false
  for (const column of Object.values(board.value.columns)) {
    column.titleEditable = false
    for (const task of Object.values(column.tasks)) {
      task.contentEditable = false
      task.titleEditable = false
    }
  }

  // unfocus all inputs
  const inputs = document.querySelectorAll('input')
  const buttons = document.querySelectorAll('button')

  for (const input of inputs) {
    input.blur()
  }
  for (const button of buttons) {
    button.blur()
  }
}

function onCompleteTaskClick(columnId: string, taskId: string) {
  // check if going from not done to done
  if (board.value.columns[columnId].tasks[taskId].complete) {
    explode()
  }
}
</script>

<template>
  <div class="container px-4 lg:max-w-8xl mx-auto flex flex-col gap-12 py-12">
    <OnClickOutside @trigger="board.titleEditable = false">
      <input
        v-if="board.titleEditable" id="title" v-model="board.title" type="text" class="dark:bg-zinc-800 bg-zinc-100 p-2 rounded-lg w-full text-5xl font-semibold" placeholder=""
        @keydown.enter="handleBoardTitleReturn"
      >
      <button v-else-if="board.title" class="text-5xl text-left inline-block self-start font-semibold cursor-pointer hover:bg-zinc-100 hover:dark:bg-zinc-800 hover:p-2 hover:rounded-lg" @click="board.titleEditable = !board.titleEditable; focusElement('title')">
        {{ board.title }}
      </button>
      <button v-else class="text-5xl text-left inline-block self-start font-semibold cursor-pointer hover:bg-zinc-100 hover:dark:bg-zinc-800 text-zinc-400 hover:p-2 hover:rounded-lg" @click="board.titleEditable = !board.titleEditable; focusElement('title')">
        Untitled board
      </button>
    </OnClickOutside>

    <div class="flex md:flex-row flex-col gap-4 justify-between">
      <div class="flex md:flex-row flex-col gap-4">
        <button class="border bg-white text-zinc-900 px-4 py-2 rounded-md" @click="addColumn">
          Add column
        </button>
        <button v-if="Object.values(board.columns)?.length" class="border border-transparent text-red-500 px-4 py-2 rounded-md" @click="clearBoard">
          Clear board
        </button>
      </div>
      <div class="flex md:flex-row flex-col gap-4">
        <button class="border px-4 py-2 rounded-md" @click="importJson">
          Import JSON
        </button>
        <button class="border px-4 py-2 rounded-md" @click="exportJson">
          Export as JSON
        </button>
      </div>
    </div>

    <div class="relative rounded-xl overflow-auto">
      <!-- Columns -->
      <div ref="columnContainer" class="relative w-full flex flex-col md:flex-row gap-6 md:overflow-x-auto md:pb-14">
        <TransitionGroup name="bounce">
          <div
            v-for="(column, key) in board.columns"
            :id="`column-${key}`"
            :key="key"
            class="shrink-0"
            @drop="onDrop($event, key)"
            @dragover.prevent
            @dragenter.prevent
          >
            <div class="md:w-[25rem]">
              <OnClickOutside
                @trigger="setColumnNotEditable(key)"
              >
                <div class="flex flex-col gap-4 border dark:border-transparent shadow-sm dark:bg-zinc-900 p-4 rounded-lg">
                  <div class="flex justify-between items-center">
                    <input
                      v-if="column.titleEditable"
                      :id="`column-${key}-title`"
                      v-model="column.title"
                      type="text"
                      class="text-2xl font-semibold dark:bg-zinc-800 bg-zinc-100 p-2 rounded-lg w-full mr-2"
                      placeholder=""
                      @keydown.enter="handleColumnTitleReturn(key)"
                    >
                    <button v-else-if="column.title" class="text-2xl text-left inline-block font-semibold cursor-pointer hover:dark:bg-zinc-800 hover:bg-zinc-100 hover:p-2 hover:rounded-lg w-full mr-2" @click.self="column.titleEditable = !column.titleEditable; focusElement(`column-${key}-title`)">
                      {{ column.title }}
                    </button>

                    <button v-else class="text-2xl text-left inline-block font-semibold cursor-pointer hover:dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-400 hover:p-2 hover:rounded-lg w-full mr-2" @click.self="column.titleEditable = !column.titleEditable; focusElement(`column-${key}-title`)">
                      Untitled column
                    </button>

                    <button class="text-red-500" @click="deleteColumn(key)">
                      <Icon name="heroicons:trash" />
                    </button>
                  </div>
                  <!-- Tasks -->
                  <div class="flex flex-col gap-4">
                    <!-- order the tasks object -->
                    <TransitionGroup name="bounce">
                      <div
                        v-for="(task, taskKey) in column.tasks"
                        :key="taskKey"
                        draggable="true"
                        class="cursor-pointer border dark:border-transparent dark:bg-zinc-700 bg-white  p-4 rounded-lg dark:shadow-sm flex flex-col gap-4 max-w-full"
                        :class="{
                          'opacity-75': task.complete,
                        }"
                        @dragstart="startDragTask($event, {
                          columnId: key,
                          taskId: taskKey,
                        })"
                        @click.self="task.contentEditable = !task.contentEditable"
                      >
                        <div class="flex flex-row items-center gap-2 justify-between">
                          <UCheckbox
                            v-model="task.complete"
                            name="notifications"
                            :ui="{
                              rounded: 'rounded-full',
                              base: `cursor-pointer h-5 w-5  transition ${task.complete ? '' : 'hover:dark:bg-zinc-400'}`,
                              background: 'bg-white dark:bg-zinc-500',
                            }"
                            @update:model-value="onCompleteTaskClick(key, taskKey)"
                          />
                          <input
                            v-if="task.titleEditable" :id="`task-${key}-${taskKey}-title`" v-model="task.title" type="text" class="font-medium dark:bg-zinc-800 bg-zinc-100 p-2 rounded-lg w-full mr-2" placeholder=""
                            @keydown.enter="task.titleEditable = false"
                          >
                          <button v-else-if="task.title" class="font-medium mr-2 text-left inline-block break-all hover:dark:bg-zinc-800 hover:bg-zinc-100 hover:p-2 hover:rounded-lg w-full" @click.self="task.titleEditable = !task.titleEditable; focusElement(`task-${key}-${taskKey}-title`)">
                            {{ task.title }}
                          </button>

                          <button v-else class="text-zinc-400 font-medium mr-2 break-all text-left inline-block hover:dark:bg-zinc-800 hover:bg-zinc-100 hover:p-2 hover:rounded-lg w-full" @click.self="task.titleEditable = !task.titleEditable; focusElement(`task-${key}-${taskKey}-title`)">
                            Untitled task
                          </button>

                          <button class="text-red-500 self-start" @click="deleteTask(key, taskKey)">
                            <Icon name="heroicons:trash" />
                          </button>
                        </div>

                        <div>
                          <textarea
                            v-if="task.contentEditable" :id="`task-${key}-${taskKey}-content`" v-model="task.content" class="dark:bg-zinc-800 bg-zinc-100 p-2 rounded-lg w-full text-xs min-h-[180px]" placeholder=""
                            @keyup.enter.exact="task.contentEditable = false"
                          />
                          <button v-else-if="task.content" class="text-xs break-all text-left inline-block hover:bg-zinc-100 hover:dark:bg-zinc-800 hover:p-2 hover:rounded-lg w-full" @click="task.contentEditable = !task.contentEditable; focusElement(`task-${key}-${taskKey}-content`)">
                            {{ task.content }}
                          </button>
                          <button v-else class="text-xs text-zinc-400 break-all  text-left inline-block hover:bg-zinc-100 hover:dark:bg-zinc-800 hover:p-2 hover:rounded-lg w-full" @click="task.contentEditable = !task.contentEditable; focusElement(`task-${key}-${taskKey}-content`)">
                            No content
                          </button>
                        </div>
                      </div>
                    </TransitionGroup>
                  </div>
                  <button class="dark:bg-zinc-800 bg-zinc-100  p-4 rounded-lg transition-colors hover:dark:bg-zinc-700 flex items-center justify-center font-medium" @click="addTask(key)">
                    Add task <Icon name="mdi:plus" />
                  </button>
                </div>
              </OnClickOutside>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
    <div class="w-full h-screen fixed top-0 left-0 pointer-events-none flex items-start justify-center overflow-hidden">
      <ConfettiExplosion v-if="visible" :stage-width="width" :stage-height="height" />
    </div>
    <footer class="fixed bottom-0 left-0 mx-auto right-0 w-full">
      <div class="container py-4 lg:max-w-8xl mx-auto flex items-center justify-between">
        <ShortcutSlideover />
        <a href="https://github.com/saganic" target="_blank">
          <Icon name="akar-icons:github-fill" />
        </a>
      </div>
    </footer>
  </div>
</template>

<style>
.bounce-enter-active {
  animation: bounce-in 0.25s;
}
.bounce-leave-active {
  animation: bounce-in 0.25s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
