import { Context } from 'hono';
import type { Env } from './index';

function standardizeCapitals(text: string) : string {
	text = text.toLowerCase().split(" ")
	text = text.map(word => {return word[0].toUpperCase() + word.substr(1)})
	return text.join(" ")
}

/**
 * Handles GET requests to fetch records from a table
 */
async function handleGet(c: Context<{ Bindings: Env }>, tableName: string, id?: string): Promise<Response> {
	//Parse parameters from the req url
	const names = c.req.queries("name")
	const categories = c.req.queries("category");
	const stores = c.req.queries("store");
	
	console.log(names)
	console.log(categories)
	try {
		let query = `SELECT * FROM Items JOIN Categories ON Items.categoryID = Categories.categoryID JOIN Stores ON Items.storeID = Stores.storeID`;
		
		// TODO add wildcards to searches
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
					query += "itemName = ?"
					values.push(standardizeCapitals(names[i]))
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
					query += "categoryName = ?"
					values.push(standardizeCapitals(categories[i]))
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
					query += "storeName = ?"
					values.push(standardizeCapitals(stores[i]))
				}
			}
		}

		console.log(query)

		//Send the query and return the results
		const results = await c.env.DB.prepare(query)
			.bind(...values)
			.all();

		return c.json(results);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

/**
 * Handles POST requests to create new records
 */
async function handlePost(c: Context<{ Bindings: Env }>, tableName: string): Promise<Response> {
	const table = sanitizeKeyword(tableName);
	const data = await c.req.json();

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return c.json({ error: 'Invalid data format' }, 400);
	}

	try {
		const columns = Object.keys(data).map(sanitizeIdentifier);
		const placeholders = columns.map(() => '?').join(', ');
		const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
		const params = columns.map(col => data[col]);

		const result = await c.env.DB.prepare(query)
			.bind(...params)
			.run();

		return c.json({ message: 'Resource created successfully', data }, 201);
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
}

/**
 * Main REST handler that routes requests to appropriate handlers
 */
export async function handleRest(c: Context<{ Bindings: Env }>): Promise<Response> {	
	switch (c.req.method) {
		case 'GET':
			return handleGet(c);
		case 'POST':
			return handlePost(c, tableName);
		default:
			return c.json({ error: 'Method not allowed' }, 405);
	}
} 
