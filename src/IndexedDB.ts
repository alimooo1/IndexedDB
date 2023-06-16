class Singleton {
  private static _instance: Singleton;
  private constructor() { }
  public static getInstance(): Singleton {
      if (!Singleton._instance) {
          Singleton._instance = new Singleton();
      }
      return Singleton._instance;
  }
}

abstract class IndexedDB{
  protected _databaseName: string;
  protected _databaseVersion: number;
  protected _objectStoreName : string;
  protected _db: IDBDatabase | null;

  protected constructor(databaseName: string, databaseVersion: number, objectStoreName: string) {
    this._databaseName = databaseName;
    this._databaseVersion = databaseVersion;
    this._objectStoreName = objectStoreName
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
        const objectStore = this._db.createObjectStore(this._objectStoreName, {
          keyPath: "id",
        });
        objectStore.createIndex("id", "id", { unique: true });
      };
    });
  }
}


class PictureIndexedDB extends IndexedDB implements Singleton{
  private static _instance: PictureIndexedDB | null = null;

  private constructor(databaseName: string, databaseVersion: number, objectStoreName: string) {
    super(databaseName, databaseVersion, objectStoreName)
  }

  public addImage(image: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onload = (event) => {
        const base64Image = event.target?.result as string;

        const transaction: IDBTransaction = this._db!.transaction(
          [this._objectStoreName],
          "readwrite"
        );
        const store: IDBObjectStore = transaction.objectStore(this._objectStoreName);
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
        [this._objectStoreName],
        "readonly"
      );

      const store: IDBObjectStore = transaction.objectStore(this._objectStoreName);
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

  public removeImage(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = this._db!.transaction(
        [this._objectStoreName],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore(this._objectStoreName);
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

  public static getInstance(databaseName: string, databaseVersion: number, objectStoreName: string) {
    if (this._instance) {
      return this._instance;
    } else {
      return new PictureIndexedDB(databaseName, databaseVersion, objectStoreName);
    }
  }
}

export { PictureIndexedDB };
