import { Context } from 'hono';
import type { Env } from './index';

//TODO caching?

function standardizeCapitals(text: string) : string {
	text = text.toLowerCase().split(" ")
	text = text.map(word => {return word[0].toUpperCase() + word.substr(1)})
	return text.join(" ")
}

function buildQueryParams(query, items, categories, stores, types) {
	let values = []
	if (items != undefined || categories != undefined || stores != undefined || types != undefined) {
		query += " WHERE "
		if (items != undefined) {
			for (var i = 0; i < items.length; i++) {
				//Add OR before every parameter but the first so that any being true will return true
				if (i != 0) {
					query += " OR "
				}
				query += "itemName LIKE ?"
				values.push("%" + standardizeCapitals(items[i]) + "%")
			}
		}
		if (categories != undefined) {
			//If there was a previous column check, we want to make sure both column checks match, not either
			if (values.length != 0) {
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
			if (values.length != 0) {
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
		if (types != undefined) {
			//If there was a previous column check, we want to make sure all column checks match, not any
			if (values.length != 0) {
				query += " AND "
			}
			for (var i = 0; i < types.length; i++) {
				if (i != 0) {
					query += " OR "
				}
				query += "typeName LIKE ?"
				values.push("%" + standardizeCapitals(types[i]) + "%")
			}
		}
	}
	return [query, values]
}

async function handleItemGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	//Parse parameters from the req url
	const id = c.req.queries("id")
	const items = c.req.queries("item");
	const categories = c.req.queries("category")
	const stores = c.req.queries("store");
	const types = c.req.queries("type");
	
	try {
		let query = `SELECT Items.itemID, itemName, price, Items.storeID, Items.categoryID FROM Items`
		
		let values = []
		if (id != undefined) { //If there's an ID, that's the only search parameter
			query += " WHERE Items.itemID = ?"
			values = [id[0]]
		} else {
			if (categories != undefined) {
				query += ` JOIN Categories ON Items.categoryID = Categories.categoryID`;
			}
			if (stores != undefined) {
				query += " JOIN Stores ON Items.storeID = Stores.storeID"
			}
			if (types != undefined) {
				query += " JOIN StoreTypes ON Stores.storeID = StoreTypes.storeID JOIN Types ON StoreTypes.typeID = Types.typeID"
			}
			
			//For each parameter, add it to the query string and list of parameterized inputs (the values array)
			//Parameterized inputs are used because they prevent SQL injections, according to the internet
			let built = buildQueryParams(query, items, categories, stores, types)
			query = built[0]
			values = built[1]
		}

		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();

		//Processing results
		let ret = {}
		for (let item of results.results) {
			//Build an object for each item, allowing us to do the division of the stored integer price for them
			ret[item.itemID] = {"itemID":item.itemID, "itemName":item.itemName,"price":(item.price / 100), "storeID":item.storeID, "categoryID":item.categoryID}
		}

		return c.json(ret);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

async function handleCategoriesGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	//Parse parameters from the req url
	const id = c.req.queries("id")
	const items = c.req.queries("item");
	const categories = c.req.queries("category");
	const stores = c.req.queries("store");
	const types = c.req.queries("type");
	
	try {
		let query = `SELECT Categories.categoryID, categoryName, COUNT(*) AS numberOfItems FROM Categories JOIN Items ON Items.categoryID = Categories.categoryID`
		let values = []
		if (id != undefined) { //If there's an ID, that's the only search parameter
			query += " WHERE Categories.categoryID = ?"
			values = [id[0]]
		} else {
			if (stores != undefined || types != undefined) {
				query += " JOIN Stores ON Items.storeID = Stores.storeID"
			}
			if (types != undefined) {
				query += " JOIN StoreTypes ON Stores.storeID = StoreTypes.storeID JOIN Types ON StoreTypes.typeID = Types.typeID"
			}
			
			
			let built = buildQueryParams(query, items, categories, stores, types)
			query = built[0]
			let values = built[1]
			
			//GROUP BY has to go last, and will make sure that no matter how many items are in a category, we just return one listing for it
			query += " GROUP BY Categories.categoryID"
		}
		
		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();
		
		//Processing results
		//(right now, just to match formatting with the results that do need processing)
		let ret = results.results

		return c.json(ret);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

async function handleStoresGet(c: Context<{ Bindings: Env }>): Promise<Response> {
	//Parse parameters from the req url
	const id = c.req.queries("id")
	const items = c.req.queries("item");
	const categories = c.req.queries("category")
	const stores = c.req.queries("store");
	const types = c.req.queries("type");
	
	try {
		let query = `SELECT Stores.storeID, storeName, description, website, address, StoreTypes.typeID, typeName, latitude, longitude FROM Stores JOIN StoreTypes ON Stores.storeID = StoreTypes.storeID JOIN Types ON StoreTypes.typeID = Types.typeID`;
		let values = []
		if (id != undefined) { //If there's an ID, that's the only search parameter
			query += " WHERE Stores.storeID = ?"
			values = [id[0]]
		} else {
			if (items != undefined || categories != undefined) {
				query += " JOIN Items ON Items.storeID = Stores.storeID"
			}
			if (categories != undefined) {
				query += " JOIN Categories ON Items.categoryID = Categories.categoryID"
			}
			
			let built = buildQueryParams(query, items, categories, stores, types)
			query = built[0]
			values = built[1]
		}
		
		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();
		
		//Processing results
		let ret = {}
		for (let store of results.results) {
			//Prebuild an object of all the type data from the entry
			//makes later stuff faster
			//(remember that if a store has multiple types, they will show up on two different rows with otherwise duplicate information)
			//(this is the whole reason we have this processing, pretty much)
			let typeObject = {"typeID":store.typeID, "typeName":store.typeName}
			
			//If this store is not yet in the output, build an object and add
			if (!(store.storeID in ret)) {
				ret[store.storeID] = {"storeID":store.storeID, "storeName":store.storeName,"description":store.description,"website":store.website,"address":store.address,"type":[typeObject],"latitude":(store.latitude / 1000000), "longitude":(store.longitude / 1000000)}
				
			//If this is an entry for a store already in the output, then it's a listing for a different type associated with that store. Add that to the existing entry.
			} else {
				if (!(typeObject in ret[store.storeID]["type"])) {
					ret[store.storeID]["type"].push(typeObject)
				}
			}
		}
		
		return c.json(ret);
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
			.bind(data.itemName, data.price / 100, data.storeID, data.categoryID)
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
