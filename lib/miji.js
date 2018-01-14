export default class miji {
	constructor() {
		this.controllers = []
		this.prefix = 'mj'
		this.marker = /\{\{(\S+)\}\}/g
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
				textNodes: [],
				store: seedData.store || {},
				computed: seedData.computed || {},
				methods: seedData.methods || {},
			})

			this.initializeController(this.controllers[index])
		}
	}

	initializeController(controller) {
		if (controller.initialized) return
		this.replaceMarkers(controller)

		const map = { // tags
			model: {},
			html: {},
			event: {},
			if: {},
			not: {},
			insert: {}
		}

		// map tags
		const active = []
		for (const key in map) {
			const mapped = []
			const elements = controller.root.querySelectorAll(`[${this.prefix}-${key}]`)

			for (const node of elements) {
				const value = node.attributes[`${this.prefix}-${key}`].value
				const data = {
					node,
					value,
				}

				if (key === 'model' || key === 'html') {
					if (active.indexOf(value) === -1) active.push(value)
				}

				if (key === 'if' || key === 'not') {
					data.rendered = true
				}
				mapped.push(data)
			}

			map[key] = mapped
		}
		controller.valueMap = map

		this.renderController(controller)
	}

	replaceMarkers(controller) {
		const root = controller.root
		const pcNodes = []
		controller.textNodes = []
		let innerHTML = root.innerHTML
		let result;

		while (result = this.marker.exec(innerHTML)) {
			innerHTML = innerHTML.replace(result[0], `<mj></mj>`)
			pcNodes.push(result[1])
		}
		root.innerHTML = innerHTML

		const mjs = root.querySelectorAll('mj')
		for (const index in pcNodes) {
			const textNode = document.createTextNode('')
			textNode.mjdata = pcNodes[index]
			mjs[index].parentElement.replaceChild(textNode, mjs[index])
			controller.textNodes.push(textNode)
		}
	}

	renderController(controller) {
		console.time('Render')

		const store = controller.store
		const computed = controller.computed

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
			let value = ''
			if (store[mod.value]) value = store[mod.value]
			if (computed[mod.value]) value = computed[mod.value](this.returnMethod(controller))

			mod.node.innerHTML = value
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

		// handle if and not
		const conditionals = [...controller.valueMap.if]
		for (const mod of controller.valueMap.not) {
			let show = computed[mod.value] && computed[mod.value](this.returnMethod(controller))
			mod.show = !show
			conditionals.push(mod)
		}

		for (const mod of conditionals) {
			let show = mod.show
			if (typeof show === 'undefined') {
				show = computed[mod.value] && computed[mod.value](this.returnMethod(controller))
			}
			if (show) {
				if (!mod.rendered) {
					mod.placeholder.parentElement.replaceChild(mod.node, mod.placeholder)
					mod.rendered = true
				}
			} else {
				if (mod.rendered) {
					mod.placeholder = mod.placeholder || document.createTextNode('')
					mod.node.parentElement.replaceChild(mod.placeholder, mod.node)
					mod.rendered = false
				}
			}
		}

		// replace markers, insert data
		for (const node of controller.textNodes) {
			const name = node.mjdata
			let value = ''
			if (store[name]) value = store[name]
			if (computed[name]) value = computed[name](this.returnMethod(controller))

			if (node.nodeValue !== value) node.nodeValue = value
		}
		console.timeEnd('Render')
	}

	returnMethod(controller) {
		return {
			store: controller.store,
			computed: controller.computed,
			set: (key, value) => {
				this.updateStore(controller, key, value)
			}
		}
	}
}
