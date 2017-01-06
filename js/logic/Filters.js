var logic;
(function (logic) {
    var FilterItem = (function () {
        function FilterItem(filter, filterValue) {
            this.name = filterValue.name;
            this.field = filter.field;
            this.filterOp = filter.filterOp;
            this.value = filterValue.value;
            this.minValue = filterValue.minValue;
            this.maxValue = filterValue.maxValue;
        }
        return FilterItem;
    }());
    logic.FilterItem = FilterItem;
    var FilterUtil = (function () {
        function FilterUtil() {
        }
        FilterUtil.getFilterQuery = function (filters) {
            var filtersByField = {};
            filters.forEach(function (filter) {
                var fieldFilters = filtersByField[filter.field];
                if (!fieldFilters) {
                    fieldFilters = [];
                    filtersByField[filter.field] = fieldFilters;
                }
                fieldFilters.push(filter);
            });
            var query = "";
            for (var field in filtersByField) {
                if (query.length > 0)
                    query += "and";
                var fieldFilters = filtersByField[field];
                fieldFilters.forEach(function (filter, i) {
                    if (i > 0)
                        query += "or";
                    query += "((" + filter.field + ")";
                    if (filter.filterOp == "between") {
                        query += "between(" + filter.minValue + "," + filter.maxValue + "))";
                    }
                    else {
                        query += filter.filterOp + "(" + filter.value + "))";
                    }
                });
            }
            return query;
        };
        return FilterUtil;
    }());
    logic.FilterUtil = FilterUtil;
})(logic || (logic = {}));
