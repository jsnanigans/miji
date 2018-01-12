export default class miji {
	constructor() {
		this.controllers = []
		this.prefix = 'mj'
	}

	select(type, name) {
		if (type === 'controller') {
			return document.querySelectorAll(`[${this.prefix}-controller="${name}"]`) || []
		}
	}

	updateStore(controller, key, newValue) {
		const store = controller.store;
		if (typeof store[key] !== 'undefined') {
			store[key] = newValue
			this.renderController(controller)
		}
	}

	addController(name, seedData = {}) {
		const elements = this.select('controller', name)

		for (const element of elements) {
			const index = this.controllers.length
			this.controllers.push({
				name,
				index,
				root: element,
				store: seedData.store || {},
				methods: seedData.methods || {}
			})

			this.initializeController(this.controllers[index])
		}
	}

	initializeController(controller) {
		if (controller.initialized) return

		const map = {
			model: {},
			html: {},
			event: {}
		}

		const active = []

		for (const key in map) {
			const mapped = []
			const elements = controller.root.querySelectorAll(`[${this.prefix}-${key}]`)

			for (const node of elements) {
				const value = node.attributes[`${this.prefix}-${key}`].value

				mapped.push({
					node,
					value,
				})

				if (key === 'model' || key === 'html') {
					if (active.indexOf(value) === -1) active.push(value)
				}
			}

			map[key] = mapped
		}

		controller.valueMap = map

		this.renderController(controller)
	}

	renderController(controller) {
		const store = controller.store

		// render model
		for (const mod of controller.valueMap.model) {
			mod.node.value = store[mod.value] || null

			// add update event
			if (mod.node.hasUpdateEvent !== true) {
				mod.node.addEventListener('input', e => {
					const newValue = mod.node.value
					this.updateStore(controller, mod.value, newValue || null)
				})
				mod.node.hasUpdateEvent = true
			}
		}

		// render html
		for (const mod of controller.valueMap.html) {
			mod.node.innerHTML = store[mod.value] || ''
		}

		// map and set event
		for (const mod of controller.valueMap.event) {
			// map event and method
			const [event, method] = mod.value.split('.')

			if (mod.node[`${event}AsCustomEvent`] !== true) {
				mod.node.addEventListener(`${event}`, e => {
					controller.methods[`${method}`](this.returnMethod(controller))
				})
				mod.node[`${event}AsCustomEvent`] = true
			}
		}
	}

	returnMethod(controller) {
		return {
			set: (key, value) => {
				this.updateStore(controller, key, value)
			}
		}
	}
}

