import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { getActionDefinitions } from './actions.js'

class WOLInstance extends InstanceBase {
	async init(config) {
		await this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.setActionDefinitions(getActionDefinitions(this))

		this.updateStatus(InstanceStatus.Ok)
	}

	// When module gets deleted
	async destroy() {}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value: 'Wake-on-LAN instance does not require any configuration',
			},
		]
	}
}

runEntrypoint(WOLInstance, [])
