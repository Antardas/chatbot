export interface Service {
	name: string;
	minor_fixes: string[];
	average_repair_cost: string;
	replacement_time: string;
}

export interface Category {
	category: string;
	services: Service[];
}

export interface RepairMethod {
	category: string;
	methods: [{ name: string; method: string }];
}

export interface Categories {
	categories: Category[];
	repairMethods: RepairMethod;
}
