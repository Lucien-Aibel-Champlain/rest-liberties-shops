import { Context } from 'hono';
import type { Env } from './index';

//TODO caching?

function standardizeCapitals(text: string) : string {
	text = text.toLowerCase().split(" ")
	text = text.map(word => {return word[0].toUpperCase() + word.substr(1)})
	return text.join(" ")
}

async function handleItemGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	//Parse parameters from the req url
	const names = c.req.queries("name")
	const categories = c.req.queries("category");
	const stores = c.req.queries("store");
	
	try {
		let query = `SELECT * FROM Items JOIN Categories ON Items.categoryID = Categories.categoryID JOIN Stores ON Items.storeID = Stores.storeID`;
		
		//For each parameter, add it to the query string and list of parameterized inputs (the values array)
		//Parameterized inputs are used because they prevent SQL injections, according to the internet
		let values = []
		if (names != undefined || categories != undefined || stores != undefined) {
			query += " WHERE "
			if (names != undefined) {
				for (var i = 0; i < names.length; i++) {
					//Add OR before every parameter but the first so that any being true will return true
					if (i != 0) {
						query += " OR "
					}
					query += "itemName LIKE ?"
					values.push("%" + standardizeCapitals(names[i]) + "%")
				}
			}
			if (categories != undefined) {
				//If there was a previous column check, we want to make sure both column checks match, not either
				if (names != undefined) {
					query += " AND "
				}
				for (var i = 0; i < categories.length; i++) {
					if (i != 0) {
						query += " OR "
					}
					query += "categoryName LIKE ?"
					values.push("%" + standardizeCapitals(categories[i]) + "%")
				}
			}
			if (stores != undefined) {
				//If there was a previous column check, we want to make sure all column checks match, not any
				if (names != undefined || categories != undefined) {
					query += " AND "
				}
				for (var i = 0; i < stores.length; i++) {
					if (i != 0) {
						query += " OR "
					}
					query += "storeName LIKE ?"
					values.push("%" + standardizeCapitals(stores[i]) + "%")
				}
			}
		}

		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();

		return c.json(results);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

async function handleCategoriesGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	const itemNames = c.req.queries("item");
	const stores = c.req.queries("store");
	
	try {
		let query = `SELECT Categories.categoryID, categoryName, COUNT(*) AS numberOfItems FROM Categories`
		if (itemNames != undefined) {
			query += " JOIN Items ON Items.categoryID = Categories.categoryID"
		}
		if (stores != undefined) {
			query += " JOIN Stores ON Items.storeID = Stores.storeID"
		}
		
		//For each parameter, add it to the query string and list of parameterized inputs (the values array)
		//Parameterized inputs are used because they prevent SQL injections, according to the internet
		let values = []
		if (itemNames != undefined || stores != undefined) {
			query += " WHERE "
			if (itemNames != undefined) {
				for (var i = 0; i < itemNames.length; i++) {
					//Add OR before every parameter but the first so that any being true will return true
					if (i != 0) {
						query += " OR "
					}
					query += "itemName LIKE ?"
					values.push("%" + standardizeCapitals(itemNames[i]) + "%")
				}
			}
			if (stores != undefined) {
				//If there was a previous column check, we want to make sure all column checks match, not any
				if (itemNames != undefined) {
					query += " AND "
				}
				for (var i = 0; i < stores.length; i++) {
					if (i != 0) {
						query += " OR "
					}
					query += "storeName LIKE ?"
					values.push("%" + standardizeCapitals(stores[i]) + "%")
				}
			}
		}
		
		//GROUP BY has to go last, and will make sure that no matter how many items are in a category, we just return one listing for it
		query += " GROUP BY Categories.categoryID"
		
		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();

		return c.json(results);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

async function handleStoresGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	const itemNames = c.req.queries("item");
	const categories = c.req.queries("category");
	
	//TODO able to search by parent categories
	
	try {
		let query = `SELECT Stores.storeID, storeName, description, website, address FROM Stores`;
		
		//For each parameter, add it to the query string and list of parameterized inputs (the values array)
		//Parameterized inputs are used because they prevent SQL injections, according to the internet
		let values = []
		if (itemNames != undefined || categories != undefined) {
			query += " JOIN Items ON Items.storeID = Stores.storeID JOIN Categories ON Items.categoryID = Categories.categoryID WHERE "
			
			if (itemNames != undefined) {
				for (var i = 0; i < itemNames.length; i++) {
					//Add OR before every parameter but the first so that any being true will return true
					if (i != 0) {
						query += " OR "
					}
					query += "itemName LIKE ?"
					values.push("%" + standardizeCapitals(itemNames[i]) + "%")
				}
			}
			if (categories != undefined) {
				//If there was a previous column check, we want to make sure all column checks match, not any
				if (itemNames != undefined) {
					query += " AND "
				}
				for (var i = 0; i < categories.length; i++) {
					if (i != 0) {
						query += " OR "
					}
					query += "categoryName LIKE ?"
					values.push("%" + standardizeCapitals(categories[i]) + "%")
				}
			}
			//GROUP BY has to go last, and will make sure that no matter how many items are in a category, we just return one listing for it
			query += " GROUP BY Stores.storeID"
		}
		
		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();

		return c.json(results);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

async function handlePostItem(c: Context<{ Bindings: Env }>): Promise<Response> {
	let data = {}
	try {
		data = await c.req.json();
	} catch (error: any) {
		return c.json({ error: 'Malformed JSON' }, 400);
	}

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return c.json({ error: 'Invalid data format' }, 400);
	}
	
	try {
		if (!data.hasOwnProperty("itemName")) {
			return c.json({ error: "itemName is a required field" }, 400);
		}
		if (!data.hasOwnProperty("price")) {
			return c.json({ error: "price is a required field" }, 400);
		}
		if (!data.hasOwnProperty("storeID")) {
			return c.json({ error: "storeID is a required field" }, 400);
		}
		if (!data.hasOwnProperty("categoryID")) {
			return c.json({ error: "categoryID is a required field" }, 400);
		}
		const query = "INSERT INTO Items(itemName, price, storeID, categoryID) VALUES (?,?,?,?)"
		
		const result = await c.env.DB.prepare(query)
			.bind(data.itemName, data.price, data.storeID, data.categoryID)
			.run();
			
		return c.json({ message: 'Item added', data }, 201);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

/**
 * Main REST handler that routes requests to appropriate handlers
 */
export async function handleRest(c: Context<{ Bindings: Env }>): Promise<Response> {
	//Extract path from URL for switching functions
	const path = new URL (c.req.url).pathname.split("/").slice(1)
	
	switch (c.req.method) {
		case 'GET':
			switch (path[0]) {
				case 'items':
				case '':
					return handleItemGet(c);
				case 'categories':
					return handleCategoriesGet(c);
				case 'stores':
					return handleStoresGet(c);
				default:
					return c.json({ error: 'Unknown request target' }, 404)
			}
		case 'POST':
			switch (path[0]) {
				case 'items':
					return handlePostItem(c);
				case 'sightings':
					//TODO later, once we talk with the team about data updating
				default:
					return c.json({ error: 'Unknown request target' }, 404)
			}
		//TODO: rate limiting on post requests? Something reasonable like 1 per ten seconds
		default:
			return c.json({ error: 'No method ' + c.req.method }, 404);
	}
} 
