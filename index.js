import miji from './lib/miji'

const app = new miji()

app.addController('demo', {
	store: {
		text: 'Default'
	},

	methods: {
		reset(context) {
			context.set('text', 'Default')
		}
	}
})