const selectPortBtn = document.getElementById('selectPortBtn')
const sendBtn = document.getElementById('sendBtn')
const terminal = document.getElementById('terminal')

// const usbVendorId = 0x0403;
// const usbVendorId = 0x1A86; //Loopback cable
const filters = [
  { usbVendorId: 0x0403 },
  { usbVendorId: 0x1A86 },
];

let port = null
const usbBauldRate = 9600;

portListeners()
selectPortBtn.addEventListener('click', requestPorts);
sendBtn.addEventListener('click', main)

async function requestPorts() {
  try {
    await navigator.serial.requestPort({ filters/*: [{ usbVendorId }] */ })
    terminal.innerText += `< CONNECTED >\n\n`
    clearTerminalStatus()
  } catch (error) {
    terminal.innerText += `< ERROR: NO PORT SELECTED >\n\n`
    terminal.classList.add('terminal_error')
  }
}

async function portListeners() {
  navigator.serial.addEventListener("connect", main)
  navigator.serial.addEventListener("disconnect", e => {
    terminal.innerText += `< DISCONNECTED >\n\n`
    clearTerminalStatus()
  })
}

async function writeOnPort(port, text) {
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();
  await writer.write(encoder.encode(text));
  writer.releaseLock();
}

async function readOnPort(port) {
  while (port.readable) {
    const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // reader canceled.
          break;
        }
        const decoder = new TextDecoder();
        const string = decoder.decode(value);
        terminal.innerText += `SENDING DATA...\n`
        terminal.innerText += `${string}\n`
        return
      }
    } catch (error) {
      console.error(error)
    } finally {
      reader.releaseLock();
    }
  }
}

async function main() {
  clearTerminalStatus()

  await navigator.serial.getPorts()
    .then((ports) => {
      port = ports[0]
      console.log({ 'Selected-Port': port })
    });

  if (port) {
    terminal.innerText = `< CONNECTED >\n\n`
    await port.open({ baudRate: usbBauldRate })
    await writeOnPort(port, '_DATA_')
    await readOnPort(port)
    await port.close()
    terminal.innerText += `\n< DONE >\n`
    terminal.classList.add('terminal_sucess')
  } else {
    terminal.innerText += `< ERROR: PORT NOT FOUND >\n\n`
    terminal.classList.add('terminal_error')
  }
}

function clearTerminalStatus() {
  terminal.classList.remove('terminal_sucess')
  terminal.classList.remove('terminal_error')
}