module controls
{
    import StdParams = catdv.StdParams;
    import PartialResultSet = catdv.PartialResultSet;

    export interface PagedDataSource
    {
        getData(params: StdParams, callback: (PartialResultSet) => void);
    }

    export class ServerPagedDataSource implements PagedDataSource
    {
        private getPagedData: (params: StdParams, callback: (PartialResultSet) => void) => void;

        constructor(getPagedData: (params: StdParams, callback: (PartialResultSet) => void) => void)
        {
            this.getPagedData = getPagedData;
        }

        public getData(params: StdParams, callback: (PartialResultSet) => void)
        {
            this.getPagedData(params, callback);
        }
    }

    export interface SimpleDataSourceParams
    {
        filter?: string;
        sortBy?: string;
        sortDir?: string;
    }

    export interface SimpleDataSource<T>
    {
        getItems(params: SimpleDataSourceParams, callback: (items: T[]) => void);
    }

    export class SimpleArrayDataSource<T> implements SimpleDataSource<T>
    {
        private items: T[];

        constructor(listItems: T[] = null)
        {
            this.items = listItems || [];
        }

        public getItems(params?: SimpleDataSourceParams, callback?: (items: T[]) => void) 
        {
            callback(this.items);
        }

        public setItems(items: T[])
        {
            this.items = items;
        }
    }

    // A SimpleArrayDataSource that allows one or more additional values to be added (to support extensible grouping controls)
    export class ExtensibleListDataSource implements SimpleDataSource<ListItem>
    {
        private originalValues: string[];
        private items: ListItem[];

        constructor(values: string[] = null)
        {
            this.originalValues = values || [];
            this.items = this.originalValues.map((s) => { return { value: s, text: s }; });
        }

        public getItems(params?: SimpleDataSourceParams, callback?: (items: ListItem[]) => void) 
        {
            callback(this.items);
        }

        public maybeAddExtendedValues(values: string[])
        {
            var unkownValues = values.filter((value) => value && !this.originalValues.contains(value));
            if (unkownValues.length > 0)
            {
                this.items = (unkownValues.concat(this.originalValues)).map((s) => { return { value: s, text: s }; });
                return true;
            }
            else if (this.items.length != this.originalValues.length)
            {
                this.items = this.originalValues.map((s) => { return { value: s, text: s }; });
                return true;
            }
            else
            {
                return false;
            }
        }
    }

    export interface ArrayCallback<T>
    {
        (items: T[]): void;
    }

    export class SimpleServerDataSource<T> implements SimpleDataSource<T>
    {
        private getData: (params: SimpleDataSourceParams, callback: ArrayCallback<T>) => void;

        constructor(getData: (params: SimpleDataSourceParams, callback: ArrayCallback<T>) => void)
        {
            this.getData = getData;
        }

        public getItems(params: SimpleDataSourceParams, callback: (listItems: T[]) => void)
        {
            this.getData(params, (data: T[]) =>
            {
                callback(data);
            });
        }
    }

    // Loads unfiltered data from the server once and then performs filtering/sorting on local cached copy
    // NOTE: local copy is never refreshed so only to be used for immutable data.
    export class CachedServerDataSource<T> implements SimpleDataSource<T>
    {
        private data: T[] = null;
        private getData: (callback: ArrayCallback<T>) => void;

        constructor(getData: (callback: ArrayCallback<T>) => void)
        {
            this.getData = getData;
        }

        public getItems(params: SimpleDataSourceParams, callback: (listItems: T[]) => void)
        {
            if (this.data)
            {
                callback(this.data);
            }
            else
            {
                this.getData((data: T[]) =>
                {
                    this.data = data;
                    callback(this.data);
                });
            }
        }
    }
}