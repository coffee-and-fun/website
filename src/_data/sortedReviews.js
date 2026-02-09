const reviews = require('./reviews.json');

function orderCoffeeShopsByRating(coffeeShops) {
	// Calculate the average ratings for each coffee shop
	const coffeeShopRatings = coffeeShops.map((coffeeShop) => {
		const ratings = Object.values(coffeeShop.categories);
		const totalRating = ratings.reduce((sum, category) => sum + category.rating, 0);
		const averageRating = parseFloat((totalRating / ratings.length).toFixed(1));
		return { ...coffeeShop, totalScore: averageRating };
	});

	// Sort the coffee shops based on average ratings in descending order
	coffeeShopRatings.sort((a, b) => b.totalScore - a.totalScore);

	// Return the sorted coffee shops
	return coffeeShopRatings;
}

module.exports = orderCoffeeShopsByRating(reviews.coffee);
