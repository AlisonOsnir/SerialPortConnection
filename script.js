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

const textToSend = "The more you know!"

const vendorsfilters = [
  { usbVendorId: 0x0403 },
  { usbVendorId: 0x0E8D },//M7 Tablet
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
    getPairedDevice(requested = true)
    clearTerminalBorder()
    sendBtn.focus()
  } catch (error) {
    terminal.innerText += `< ERROR: NO PORT SELECTED >\n`
    terminal.classList.add('terminal--warning')
  }
}


async function writeOnPort(port, text) {
  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(text));
    writer.releaseLock();
    terminal.innerText += `\n WRITING: ${text}\n`
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO WRITE ON PORT >\n`
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
        terminal.innerText += `\n READING: ${string}\n`
        return
      }
    } catch (error) {
      console.error(error)
      terminal.innerText += `< ERROR: FAIL TO READ ON PORT >\n`
    } finally {
      reader.releaseLock();
    }
  }
}

async function getPairedDevice(requested) {
  const ports = await navigator.serial.getPorts();
  port = ports[0];

  if (port) {
    portInfo = await port.getInfo();
    console.log('Selected Device:', portInfo);
    terminalOnConnect(requested)
  }
}

async function main() {
  clearTerminalBorder()
  try {
    // if (!port) await getPairedPort()
    if (port) {
      await port.open(portOpenOptions)
      await writeOnPort(port, textToSend)
      await readOnPort(port)
      await port.close()
      terminal.innerText += `\n< DONE >\n\n`
      terminal.classList.add('terminal--success')
      terminal.scrollTo(0, terminal.scrollHeight);
    } else {
      terminal.innerText += `< ERROR: PORT NOT FOUND >\n`
      terminal.classList.add('terminal--error')
    }
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO WRITE ON PORT >\n`
    terminal.classList.add('terminal--error')
  }
}

function clearTerminalBorder() {
  terminal.classList.remove('terminal--success')
  terminal.classList.remove('terminal--error')
  terminal.classList.remove('terminal--warning')
}

function clearTerminalDevice() {
  terminalDevice.classList.remove('terminalDevice--connected')
}

function terminalOnConnect(requested) {
  terminalDevice.textContent = `Product ID: ${portInfo.usbProductId} | Vendor ID: ${portInfo.usbVendorId}`;
  terminalDevice.classList.add('terminalDevice--connected')
  if(requested) {
    terminal.innerText += `< DEVICE WAS PAIRED >\n`
    terminal.innerText += `< CONNECTED >\n`;
    return
  }
  terminal.innerText = `< CONNECTED >\n`;
}

function terminalOnDisconnected() {
  terminalDevice.textContent = "No connection available";
  terminal.innerText += `< DISCONNECTED >\n\n\n`
  clearTerminalBorder()
  clearTerminalDevice()
  requestPortBtn.focus()
}


window.addEventListener("load", async () => {
  await getPairedDevice()
  if (port && sendOnConnectCheck.checked) main()
})

navigator.serial.addEventListener("connect", async () => {
  await getPairedDevice()
  if (sendOnConnectCheck.checked) main()
})

navigator.serial.addEventListener("disconnect", terminalOnDisconnected)

requestPortBtn.addEventListener('click', requestPorts);
sendBtn.addEventListener('click', main)