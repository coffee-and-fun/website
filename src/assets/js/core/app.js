import Vue from 'vue';
import { crisp, loadManager, tagManager } from './third-party';

function load() {
	new Vue({
		el: '#too-shy-to-ask-website',
		data: {
			menus: false,
			// Pricing Table
			isYearly: true,
			selectedTab: 0
		},
		mounted() {
			crisp();
			tagManager();
			loadManager();
		},
		methods: {},
		computed: {}
	});
}

export { load }; // a list of exported variables
