const requestPortBtn = document.getElementById('requestPortBtn')
const sendBtn = document.getElementById('sendBtn')
const portBaudRate = document.getElementById('baudrate')
const portDataBits = document.getElementById('databits')
const portParity = document.getElementById('parity')
const porStopBits = document.getElementById('stopbits')
const sendOnConnectCheck = document.getElementById('sendOnConnect')
const readCheck = document.getElementById('read')
const terminal = document.getElementById('terminal')
const terminalDevice = document.getElementById('terminalDevice')

let port = null
let portInfo = null

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

async function requestPorts() {
  try {
    await navigator.serial.requestPort({ filters: vendorsfilters }) /*: [{ usbVendorId }] */
    terminal.innerText += `< DEVICE WAS PAIRED >\n\n`
    clearTerminalBorder()
    sendBtn.focus()
  } catch (error) {
    terminal.innerText += `< ERROR: NO PORT SELECTED >\n\n`
    terminal.classList.add('terminal--error')
  }
}


async function writeOnPort(port, text) {
  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(text));
    writer.releaseLock();
    terminal.innerText += `WRITING: ${text}\n`
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
        terminal.innerText += `\nREADING: ${string}\n`
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
    portInfo = await port.getInfo();
    console.log('Selected Port:', portInfo);
  }
}

async function main() {
  clearTerminalBorder()
  try {
    await getPairedPorts()
    if (port) {
      await port.open(portOpenOptions)
      await writeOnPort(port, 'TheMoreYouNow!')
      await readOnPort(port)
      await port.close()
      terminal.innerText += `\n< DONE >\n\n`
      terminal.classList.add('terminal--success')
    } else {
      terminal.innerText += `< ERROR: PORT NOT FOUND >\n\n`
      terminal.classList.add('terminal--error')
    }
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO WRITE ON PORT >\n\n`
  }
}

function clearTerminalBorder() {
  terminal.classList.remove('terminal--success')
  terminal.classList.remove('terminal--error')
}

function clearTerminalDevice() {
  terminalDevice.classList.remove('terminalDevice--connected')
}

function terminalOnConnect() {
  terminalDevice.textContent = `Product ID: ${portInfo.usbProductId} | Vendor ID: ${portInfo.usbVendorId}`;
  terminalDevice.classList.add('terminalDevice--connected')
  terminal.innerText = `< CONNECTED >\n\n`;
}

function terminalOnDisconnected() {
  terminalDevice.textContent = "No connection available";
  terminal.innerText += `< DISCONNECTED >\n\n\n`
  clearTerminalBorder()
  clearTerminalDevice()
  requestPortBtn.focus()
}


window.addEventListener("load", async () => {
  await getPairedPorts()
  if (port) terminalOnConnect()
  if (port && sendOnConnectCheck.checked) main()
})

navigator.serial.addEventListener("connect", async () => {
  await getPairedPorts()
  terminalOnConnect()
  if (sendOnConnectCheck.checked) main()
})

navigator.serial.addEventListener("disconnect", terminalOnDisconnected)

requestPortBtn.addEventListener('click', requestPorts);
sendBtn.addEventListener('click', main)