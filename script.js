const requestBtn = document.getElementById('requestBtn')
const sendBtn = document.getElementById('sendBtn')
const portBaudRate = document.getElementById('baudrate')
const portDataBits = document.getElementById('databits')
const portParity = document.getElementById('parity')
const porStopBits = document.getElementById('stopbits')
const autoSend = document.getElementById('autoSend')
const terminal = document.getElementById('terminal')
const terminalDevice = document.getElementById('terminalDevice')

const stringToSend = "The more you know!\r\n"
let device = null
let deviceInfos = null

const vendorfilter = [
  { usbVendorId: 0x1A86 }, //Loopback cable
];

const portConfigs = {
  baudRate: portBaudRate.value,
  dataBits: portDataBits.value,
  parity: portParity.value,
  porstopBits: porStopBits.value
}

async function requestDevice() {
  try {
    device = await navigator.serial.requestPort({ filters: vendorfilter })
    clearTerminalBorder()
    await getDeviceInfos()
    terminalOnConnect()

    if (autoSend.checked) {
      main()
    }

  } catch (error) {
    console.log(error)
    terminal.innerText += `< ERROR: NO DEVICE SELECTED --- ${error} >\n`
    terminal.classList.add('terminal--warning')
  }
}

async function getPairedDevice() {
  const devices = await navigator.serial.getPorts()
  device = devices[0]

  if (device !== null) {
    await getDeviceInfos()
    terminalOnConnect()

    if (autoSend.checked) {
      main()
    }
  }
}

async function getDeviceInfos() {
  deviceInfos = await device.getInfo()
  console.log('Device:', deviceInfos)
}

async function send(string) {
  try {
    const encoder = new TextEncoder()
    const writer = device.writable.getWriter()
    await writer.write(encoder.encode(string))
    writer.releaseLock();
    terminal.innerText += `SENDING: ${string}`
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: FAIL TO SEND DATA --- ${error} >\n`
  }
}

async function receive() {
  while (device.readable) {
    const reader = device.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break;  // reader canceled.

        const decoder = new TextDecoder()
        const string = decoder.decode(value)
        terminal.innerText += `READING: ${string}`
        terminal.innerText += '\n'
        return
      }
    } catch (error) {
      console.error(error)
      terminal.innerText += `< ERROR: FAIL TO RECEIVE DATA --- ${error} >\n`
    } finally {
      reader.releaseLock()
    }
  }
}

async function main() {
  clearTerminalBorder()
  try {
    if (device !== null) {
      await device.open(portConfigs)
      await send(stringToSend)
      // await receive()
      setTimeout(await receive(), 100)
      await device.close()

      terminal.classList.add('terminal--success')
      terminal.scrollTo(0, terminal.scrollHeight)
    } else {
      terminal.innerText += `< ERROR: DEVICE NOT FOUND >\n`
      terminal.classList.add('terminal--error')
    }
  } catch (error) {
    console.error(error)
    terminal.innerText += `< ERROR: MAIN FUNCTION ERROR --- ${error} >\n`
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

function terminalOnConnect() {
  terminalDevice.textContent = `Product ID: ${deviceInfos.usbProductId} | Vendor ID: ${deviceInfos.usbVendorId}`;
  terminalDevice.classList.add('terminalDevice--connected')
  terminal.innerText = `< CONNECTED >\n\n`;
}

function terminalOnDisconnected() {
  device = null
  clearTerminalBorder()
  clearTerminalDevice()
  requestBtn.focus()
  terminalDevice.textContent = "No connection available"
  terminal.innerText += `< DISCONNECTED >\n`
  terminal.scrollTo(0, terminal.scrollHeight)
}

navigator.serial.addEventListener("connect", getPairedDevice)
navigator.serial.addEventListener("disconnect", terminalOnDisconnected)

requestBtn.addEventListener('click', requestDevice)
sendBtn.addEventListener('click', main)

portBaudRate.addEventListener('change', () => {
  portConfigs.baudRate = portBaudRate.value
})
