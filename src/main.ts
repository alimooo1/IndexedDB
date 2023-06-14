import { PictureIndexedDB } from "./IndexedDB";

const form = document.querySelector(".file-reader");
const file = document.querySelector("input");

const createDB = async () => {
  const database = PictureIndexedDB.getInstance("PictureDB", 1);
  await database.initialize();
  return database;
};

const showImages = async () => {
  const imagesDiv = document.querySelector(".images");
  imagesDiv!.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const images = (await database).getImages();
  for (let image of await images) {
    const imgTag = document.createElement("img");
    imgTag.src = image.data;
    fragment.appendChild(imgTag);
  }
  imagesDiv?.appendChild(fragment);
  (await database).deleteData(1686733930721);
};

const database = createDB();

const submitHandler = async (event: Event) => {
  event.preventDefault();
  if (file!.files![0]) {
    (await database).addImage(file!.files![0]);
  }
  showImages();
};

showImages();
form?.addEventListener("submit", submitHandler);
