historyREPLs = {}

// Scroll a given REPL to the bottom.
function resetScrollREPL(n) {
    let divrepl = document.getElementById(`repl-${n}`)
    divrepl.scrollTop = divrepl.scrollHeight
}

// Insert a line of output to a given REPL.
function putLineToREPL(linestr, n) {
    let divout = document.getElementById(`repl-output-${n}`)
    let ind = divout.children.length
    let newline = document.createElement("div")
    newline.dataset.index = ind
    newline.innerText = linestr
    divout.appendChild(newline)
    resetScrollREPL(n)
}

// Create all of the components necessary for a REPL.
function buildREPL(n, inittext, prompt) {
    let repl = document.getElementById(`repl-${n}`)
    repl.innerHTML = `
        <div id="repl-output-${n}" class="repl-output">
            <div data-index="0">${inittext}</div>
        </div>
        <div class="repl-input-wrapper">
            ${prompt}
            <input id="repl-input-${n}" class="repl-input" type="text"></input>
        </div>
    `
}

// Associate a handler function with a REPL, making it responsive.
// Handler function should take two inputs: int ID of REPL, and str input.
function registerREPL(handler, n) {
    historyREPLs[n] = [0, []]
    let replin = document.getElementById(`repl-input-${n}`)
    replin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handler(n, replin.value)
            historyREPLs[n][1].unshift(replin.value)
            historyREPLs[n][0] = 0
            replin.value = ''
        } else if (e.key === 'ArrowUp') {
            if (historyREPLs[n][0] < historyREPLs[n][1].length) {
                historyREPLs[n][0] += 1
                replin.value = historyREPLs[n][1][historyREPLs[n][0]-1]
            }
        } else if (e.key === 'ArrowDown') {
            if (historyREPLs[n][0] > 0) {
                historyREPLs[n][0] += -1
                if (historyREPLs[n][0] == 0) {
                    replin.value = ''
                } else { 
                    replin.value = historyREPLs[n][1][historyREPLs[n][0]-1]
                }
            }
        }
    })
}
