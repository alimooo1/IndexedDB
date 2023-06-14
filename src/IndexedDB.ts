class PictureIndexedDB {
  private _databaseName: string;
  private _databaseVersion: number;
  private _db: IDBDatabase | null;
  private static _instance: PictureIndexedDB | null = null;

  private constructor(databaseName: string, databaseVersion: number) {
    this._databaseName = databaseName;
    this._databaseVersion = databaseVersion;
    this._db = null;
  }

  public initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._databaseName, this._databaseVersion);

      request.onerror = (event: Event) => {
        reject(
          `Failed to open database: ${(event.target as IDBOpenDBRequest).error}`
        );
      };

      request.onsuccess = (event: Event) => {
        this._db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        this._db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
        const objectStore = this._db.createObjectStore("images", {
          keyPath: "id",
        });
        objectStore.createIndex("id", "id", { unique: true });
      };
    });
  }

  public removeImage(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = this._db!.transaction(
        ["images"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("images");
      const request: IDBRequest = store.add(data);

      transaction.oncomplete = () => {
        resolve();
      };

      request.onerror = (event: Event) => {
        reject(
          `Failed to add data: ${(event.target as IDBOpenDBRequest).error}`
        );
      };
    });
  }

  public addImage(image: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onload = (event) => {
        const base64Image = event.target?.result as string;

        const transaction: IDBTransaction = this._db!.transaction(
          ["images"],
          "readwrite"
        );
        const store: IDBObjectStore = transaction.objectStore("images");
        const imageObject = { id: Date.now(), data: base64Image };

        const request: IDBRequest = store.add(imageObject);

        transaction.oncomplete = () => {
          resolve();
        };

        request.onerror = (event: Event) => {
          reject(
            `Failed to save image: ${(event.target as IDBOpenDBRequest).error}`
          );
        };
      };

      reader.onerror = (event) => {
        reject(
          `Failed to read image file: ${(event.target as FileReader).error}`
        );
      };
    });
  }

  public getImages(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = this._db!.transaction(
        ["images"],
        "readonly"
      );

      const store: IDBObjectStore = transaction.objectStore("images");
      const request: IDBRequest = store.getAll();

      request.onsuccess = (event: Event) => {
        console.log(request.result);

        resolve((event.target as IDBOpenDBRequest).result as unknown as any[]);
      };

      request.onerror = (event: Event) => {
        reject(
          `Failed to retrieve data: ${(event.target as IDBOpenDBRequest).error}`
        );
      };
    });
  }

  public deleteData(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = this._db!.transaction(
        ["images"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("images");
      const request: IDBRequest = store.delete(id);

      transaction.oncomplete = () => {
        resolve();
      };

      request.onerror = (event: Event) => {
        reject(
          `Failed to delete data: ${(event.target as IDBOpenDBRequest).error}`
        );
      };
    });
  }

  public static getInstance(databaseName: string, databaseVersion: number) {
    if (this._instance) {
      return this._instance;
    } else {
      return new PictureIndexedDB(databaseName, databaseVersion);
    }
  }
}

export { PictureIndexedDB };
