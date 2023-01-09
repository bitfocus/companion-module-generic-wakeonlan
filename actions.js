import wol from 'wake_on_lan'

export function getActionDefinitions(self) {
	const regex_mac = new RegExp(/^[0-9a-fA-F]{12}$/)

	return {
		send_simple: {
			name: 'simple',
			options: [
				{
					type: 'textinput',
					id: 'id_broadcast_mac',
					label: 'MAC address:',
					default: '',
					regex: '/^([0-9a-f]{2}([:.-]{0,1}|$)){6}$/i',
				},
			],
			callback: (action) => {
				const mac = action.options.id_broadcast_mac.replace(/[:.-]/g, '')
				if (regex_mac.test(mac)) {
					wol.wake(mac, {
						num_packets: 1,
					})
				}
			},
		},
		send_advanced: {
			name: 'advanced',
			options: [
				{
					type: 'textinput',
					id: 'id_advanced_mac',
					label: 'MAC address:',
					default: '',
					regex: '/^([0-9a-f]{2}([:.-]{0,1}|$)){6}$/i',
				},
				{
					type: 'textinput',
					id: 'id_address',
					label: 'Destination IP:',
					default: '255.255.255.255',
					regex: self.REGEX_IP,
				},
				{
					type: 'textinput',
					id: 'id_port',
					label: 'UDP port:',
					default: '9',
					regex: self.REGEX_PORT,
				},
				{
					type: 'textinput',
					id: 'id_count',
					label: 'Resend attempts:',
					default: '3',
					regex: self.REGEX_NUMBER,
				},
				{
					type: 'textinput',
					id: 'id_interval',
					label: 'Interval between packet resend (ms):',
					default: '100',
					regex: self.REGEX_NUMBER,
				},
			],
			callback: (action) => {
				const mac = action.options.id_advanced_mac.replace(/[:.-]/g, '')
				if (regex_mac.test(mac)) {
					const options = {
						port: action.options.id_port,
						address: action.options.id_address,
						num_packets: action.options.id_count,
						interval: action.options.id_interval,
					}

					wol.wake(mac, options, function (error) {
						if (error) {
							// handle error
						} else {
							// done sending packets
							console.log('sent ok')
						}
					})
				}
			},
		},
	}
}
