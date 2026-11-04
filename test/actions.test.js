import assert from 'node:assert/strict'
import dgram from 'node:dgram'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { getActionDefinitions } from '../actions.js'

const actions = getActionDefinitions({})
const mac = '0123456789ab'
const expected = Buffer.concat([Buffer.alloc(6, 255), ...Array.from({ length: 16 }, () => Buffer.from(mac, 'hex'))])

test('simple sends one magic packet to the default broadcast destination', async (t) => {
	const sends = []
	const socket = new EventEmitter()
	socket.close = () => {}
	socket.setBroadcast = (enabled) => assert.equal(enabled, true)
	socket.send = (packet, offset, length, port, address, callback) => {
		sends.push({ packet, offset, length, port, address })
		queueMicrotask(() => callback(null))
	}
	t.mock.method(dgram, 'createSocket', () => socket)
	actions.send_simple.callback({ options: { id_broadcast_mac: '01:23:45:67:89:ab' } })
	socket.emit('listening')
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(sends.length, 1)
	assert.deepEqual(sends[0], { packet: expected, offset: 0, length: 102, port: 9, address: '255.255.255.255' })
})

test('advanced sends repeated exact magic packets over UDP to the selected address and port', async (t) => {
	const server = dgram.createSocket('udp4')
	t.after(() => server.close())
	await new Promise((resolve) => server.bind(0, '127.0.0.1', resolve))
	const received = new Promise((resolve, reject) => {
		const packets = []
		const timeout = setTimeout(() => reject(new Error('UDP packets not received')), 2000)
		t.after(() => clearTimeout(timeout))
		server.on('message', (packet) => {
			packets.push(packet)
			if (packets.length === 3) resolve(packets)
		})
	})
	actions.send_advanced.callback({ options: {
		id_advanced_mac: '01-23-45-67-89-ab', id_address: '127.0.0.1',
		id_port: server.address().port, id_count: 3, id_interval: 10,
	} })
	for (const packet of await received) assert.deepEqual(packet, expected)
})

test('invalid MAC addresses do not create a socket for either action', (t) => {
	const createSocket = t.mock.method(dgram, 'createSocket', () => { throw new Error('unexpected network use') })
	for (const mac of ['', '01:23:45:67:89:zz', '0123456789', '0123456789abcd']) {
		actions.send_simple.callback({ options: { id_broadcast_mac: mac } })
		actions.send_advanced.callback({ options: { id_advanced_mac: mac } })
	}
	assert.equal(createSocket.mock.calls.length, 0)
})

test('advanced preserves text-input destination, count and interval options', async (t) => {
	const sends = []
	const socket = new EventEmitter()
	socket.close = () => {}
	socket.setBroadcast = () => {}
	socket.send = (packet, offset, length, port, address, callback) => {
		sends.push({ packet, port, address, time: Date.now() })
		queueMicrotask(() => callback(null))
	}
	t.mock.method(dgram, 'createSocket', () => socket)
	actions.send_advanced.callback({ options: {
		id_advanced_mac: '01.23.45.67.89.ab', id_address: '192.0.2.10',
		id_port: '4000', id_count: '3', id_interval: '10',
	} })
	await new Promise((resolve) => setTimeout(resolve, 100))
	assert.equal(sends.length, 3)
	for (const send of sends) {
		assert.deepEqual(send.packet, expected)
		assert.equal(send.port, '4000')
		assert.equal(send.address, '192.0.2.10')
	}
	assert.ok(sends[2].time - sends[0].time >= 15)
})
