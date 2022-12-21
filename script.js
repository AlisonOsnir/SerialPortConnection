const requestPortBtn = document.getElementById('requestPortBtn')
const sendBtn = document.getElementById('sendBtn')
const portBaudRate = document.getElementById('baudrate')
const portDataBits = document.getElementById('databits')
const portParity = document.getElementById('parity')
const porStopBits = document.getElementById('stopbits')
const readCheck = document.getElementById('read')
const terminal = document.getElementById('terminal')

let port = null

const vendorsfilters = [
  { usbVendorId: 0x0403 },
  { usbVendorId: 0x1A86 },//Loopback cable
];

const portOpenOptions = {
  baudRate: portBaudRate.value,
  dataBits: portDataBits.value,
  parity: portParity.value,
  porstopBits: porStopBits.value
}

window.addEventListener("load", getPairedPorts);
portListeners()
requestPortBtn.addEventListener('click', requestPorts);
sendBtn.addEventListener('click', main)

async function requestPorts() {
  try {
    await navigator.serial.requestPort({ filters: vendorsfilters }) /*: [{ usbVendorId }] */
    terminal.innerText += `< DEVICE WAS PAIRED >\n\n`
    clearTerminalState()
    sendBtn.focus()
  } catch (error) {
    terminal.innerText += `< ERROR: NO PORT SELECTED >\n\n`
    terminal.classList.add('terminal_error')
  }
}

async function portListeners() {
  navigator.serial.addEventListener("connect", main)
  navigator.serial.addEventListener("disconnect", e => {
    terminal.innerText += `< DISCONNECTED >\n\n`
    clearTerminalState()
    requestPortBtn.focus()
  })
}

async function writeOnPort(port, text) {
  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(text));
    writer.releaseLock();
    terminal.innerText += `WRITING: \t${text}\n`
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO WRITE ON PORT >\n\n`
  }
}

async function readOnPort(port) {
  if (!readCheck.checked) return
  while (port.readable) {
    const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;  // reader canceled.
        
        const decoder = new TextDecoder();
        const string = decoder.decode(value);
        terminal.innerText += `\nREADING: \t${string}\n`
        return
      }
    } catch (error) {
      console.error(error)
      terminal.innerText += `< ERROR: FAIL TO READ ON PORT >\n\n`
    } finally {
      reader.releaseLock();
    }
  }
}

async function getPairedPorts() {
  const ports = await navigator.serial.getPorts();
  port = ports[0];

  if (port) {
    const portInfo = await port.getInfo();
    console.log('Selected Port:', portInfo);
    terminal.innerText = `Product ID: ${portInfo.usbProductId}\t\|\tVendor ID: ${portInfo.usbVendorId}\n\n`;
    terminal.innerText += `< CONNECTED >\n\n`;
  }
}

async function main() {
  clearTerminalState()
  try {
    await getPairedPorts()
    if (port) {
      await port.open(portOpenOptions)
      await writeOnPort(port, 'TheMoreYouNow!')
      await readOnPort(port)
      await port.close()
      terminal.innerText += `\n< DONE >\n`
      terminal.classList.add('terminal_sucess')
    } else {
      terminal.innerText += `< ERROR: PORT NOT FOUND >\n\n`
      terminal.classList.add('terminal_error')
    }
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO WRITE ON PORT >\n\n`
  }
}

function clearTerminalState() {
  terminal.classList.remove('terminal_sucess')
  terminal.classList.remove('terminal_error')
}


