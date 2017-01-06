var controls;
(function (controls) {
    var ServerPagedDataSource = (function () {
        function ServerPagedDataSource(getPagedData) {
            this.getPagedData = getPagedData;
        }
        ServerPagedDataSource.prototype.getData = function (params, callback) {
            this.getPagedData(params, callback);
        };
        return ServerPagedDataSource;
    }());
    controls.ServerPagedDataSource = ServerPagedDataSource;
    var SimpleArrayDataSource = (function () {
        function SimpleArrayDataSource(listItems) {
            if (listItems === void 0) { listItems = null; }
            this.items = listItems || [];
        }
        SimpleArrayDataSource.prototype.getItems = function (params, callback) {
            callback(this.items);
        };
        SimpleArrayDataSource.prototype.setItems = function (items) {
            this.items = items;
        };
        return SimpleArrayDataSource;
    }());
    controls.SimpleArrayDataSource = SimpleArrayDataSource;
    // A SimpleArrayDataSource that allows one or more additional values to be added (to support extensible grouping controls)
    var ExtensibleListDataSource = (function () {
        function ExtensibleListDataSource(values) {
            if (values === void 0) { values = null; }
            this.originalValues = values || [];
            this.items = this.originalValues.map(function (s) { return { value: s, text: s }; });
        }
        ExtensibleListDataSource.prototype.getItems = function (params, callback) {
            callback(this.items);
        };
        ExtensibleListDataSource.prototype.maybeAddExtendedValues = function (values) {
            var _this = this;
            var unkownValues = values.filter(function (value) { return value && !_this.originalValues.contains(value); });
            if (unkownValues.length > 0) {
                this.items = (unkownValues.concat(this.originalValues)).map(function (s) { return { value: s, text: s }; });
                return true;
            }
            else if (this.items.length != this.originalValues.length) {
                this.items = this.originalValues.map(function (s) { return { value: s, text: s }; });
                return true;
            }
            else {
                return false;
            }
        };
        return ExtensibleListDataSource;
    }());
    controls.ExtensibleListDataSource = ExtensibleListDataSource;
    var SimpleServerDataSource = (function () {
        function SimpleServerDataSource(getData) {
            this.getData = getData;
        }
        SimpleServerDataSource.prototype.getItems = function (params, callback) {
            this.getData(params, function (data) {
                callback(data);
            });
        };
        return SimpleServerDataSource;
    }());
    controls.SimpleServerDataSource = SimpleServerDataSource;
    // Loads unfiltered data from the server once and then performs filtering/sorting on local cached copy
    // NOTE: local copy is never refreshed so only to be used for immutable data.
    var CachedServerDataSource = (function () {
        function CachedServerDataSource(getData) {
            this.data = null;
            this.getData = getData;
        }
        CachedServerDataSource.prototype.getItems = function (params, callback) {
            var _this = this;
            if (this.data) {
                callback(this.data);
            }
            else {
                this.getData(function (data) {
                    _this.data = data;
                    callback(_this.data);
                });
            }
        };
        return CachedServerDataSource;
    }());
    controls.CachedServerDataSource = CachedServerDataSource;
})(controls || (controls = {}));
