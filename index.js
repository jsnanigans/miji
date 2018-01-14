import miji from './lib/miji'

const app = new miji()

app.addController('demo', {
	store: {
		text: 'Default',
		other: ''
	},

	computed: {
		isDefault({store}) {
			return store.text === 'Default'
		},
		uppercased({store}) {
			return store.text ? store.text.toUpperCase() : ''
		}
	},

	methods: {
		reset(context) {
			context.set('text', 'Default')
		}
	}
})