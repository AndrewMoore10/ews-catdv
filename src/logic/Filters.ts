module logic
{
    import Filter = catdv.Filter;
    import FilterValue = catdv.FilterValue;
    import QueryDefinition = catdv.QueryDefinition;
    import QueryTerm = catdv.QueryTerm;

    export class FilterItem
    {
        public name: string;
        public field: string;
        public filterOp: string;
        public value: string;
        public minValue: string;
        public maxValue: string;

        constructor(filter: Filter, filterValue: FilterValue)          
        {
            this.name = filterValue.name;
            this.field = filter.field;
            this.filterOp = filter.filterOp;
            this.value = filterValue.value;
            this.minValue = filterValue.minValue;
            this.maxValue = filterValue.maxValue;
        }
    }

    export class FilterUtil
    {
        public static getFilterQuery(filters: FilterItem[]): string
        {
            var filtersByField: { [field: string]: FilterItem[] } = {};

            filters.forEach((filter) =>
            {
                var fieldFilters = filtersByField[filter.field];
                if (!fieldFilters)
                {
                    fieldFilters = [];
                    filtersByField[filter.field] = fieldFilters;
                }
                fieldFilters.push(filter);
            });

            var query = "";

            for (var field in filtersByField)
            {
                if (query.length > 0) query += "and";
                var fieldFilters = filtersByField[field];
                fieldFilters.forEach((filter, i) =>
                {
                    if (i > 0) query += "or";
                    query += "((" + filter.field + ")";
                    if (filter.filterOp == "between")
                    {
                        query += "between(" + filter.minValue + "," + filter.maxValue + "))";
                    }
                    else
                    {
                        query += filter.filterOp + "(" + filter.value + "))";
                    }
                });
            }

            return query;
        }

    }
}