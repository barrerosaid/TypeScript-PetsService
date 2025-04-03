// use bluebird promises (has more concurrent options)
import * as Promise from 'bluebird';
// use axios to make HTTP API calls to the pet-store
import axios from 'axios';
// import quick and dirty pet store api types
import {PetTypes, PetDto, PetListWithCountsDto } from './pet-store-api-types';
//import { MinPriorityQueue } from '@datastructures-js/priority-queue';
//import { MinHeap } from 'heap-js';

// Set some constants based on the environment such that this script can run locally or in a docker container
const PET_STORE_HOST = process.env.PET_STORE_HOST || 'localhost';
const PET_STORE_PORT = parseInt(process.env.PET_STORE_PORT || '3330', 10);
const PET_STORE_URL = `http://${PET_STORE_HOST}:${PET_STORE_PORT}`;
const PET_STORE_URL_PET_API_V1 = `${PET_STORE_URL}/api/v1/pet`;

//ADDED

// Function to print total counts of different pet types
const printTotalCounts = async () => {
  const results = await Promise.all([
    axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?limit=1`), // Total pets
    axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Bird&limit=1`),
    axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Cat&limit=1`),
    axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Dog&limit=1`),
    axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Reptile&limit=1`),
  ]);

  console.log(`How many total pets are in the pet-shop? ${results[0].data.totalCount}`);
  console.log(`How many birds are in the pet-shop? ${results[1].data.filteredCount}`);
  console.log(`How many cats are in the pet-shop? ${results[2].data.filteredCount}`);
  console.log(`How many dogs are in the pet-shop? ${results[3].data.filteredCount}`);
  console.log(`How many reptiles are in the pet-shop? ${results[4].data.filteredCount}`);
};

// Function to count cats with age >= 5
const countOlderCats = async () => {
  const response = await axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Cat&age[gte]=5&limit=1`);
  console.log(`How many cats are there with age equal to or greater than 5 in the pet-shop? ${response.data.filteredCount}`);
};

// Function to get the total cost of all birds
const totalCostOfBirds = async () => {
  try {
    const response = await axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Bird`);
    
    // Sum the total cost (still in pennies)
    const totalCostInPennies = response.data.data.reduce((sum, pet) => sum + pet.cost, 0);
    
    // Convert to dollars and round to 2 decimal places
    const totalCostInDollars = (totalCostInPennies / 100).toFixed(2);
    
    console.log(`How much would it cost to buy all the birds in the pet-shop? $${totalCostInDollars}`);
  } catch (error) {
    console.error(`Error fetching the total cost of birds:`, error.message);
  }
};

// Function to calculate the average age of pets that cost less than $90
const averageAgeOfCheapPets = async () => {
  const response = await axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?cost[lt]=9000`);
  const pets = response.data.data;

  if (pets.length === 0) {
    console.log("What is the average age of pets that cost less than $90.00? No pets found.");
    return;
  }

  const averageAge = pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length;
  console.log(`What is the average age of pets that cost less than $90.00? ${averageAge.toFixed(2)} years old`);
};

// Function to get the 3rd most recently updated dog
// Function to get the 3rd most recently updated dog using a Min Heap (Priority Queue)
/*
const fetchNthMostRecentDog = async (n: number) => {
  try {
    const response = await axios.get<PetListWithCountsDto>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Dog`);
    const dogs: PetDto[] = response.data.data;

    if (dogs.length < n) {
      console.log(`There are less than ${n} dogs in the pet shop.`);
      return;
    }

    // Min Heap to keep track of the top `n` most recently updated dogs
    const minHeap = new MinPriorityQueue<PetDto>(({ updatedAt }) => new Date(updatedAt).getTime());

    for (const dog of dogs) {
      minHeap.enqueue(dog);
      if (minHeap.size() > n) {
        minHeap.dequeue(); // Remove the least recent if more than `n`
      }
    }

    const nthMostRecentDog = minHeap.front(); // The smallest element in the heap is the N-th most recent
    console.log(`What is the name of the 3rd most recently updated dog? ${nthMostRecentDog.name}`);
  } catch (error) {
    console.error(`Error fetching the ${n}th most recently updated dog:`, error.message);
  }
};
*/
/*
// Function to get the 3rd most recently updated dog
const fetchNthMostRecentDog = async (n: number) => {
  try {
    const response = await axios.get<{ data: PetDto[] }>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Dog`);
    const dogs = response.data.data;

    if (dogs.length < n) {
      console.log(`There are less than ${n} dogs in the pet shop.`);
      return;
    }

    // Min Heap to track top `n` most recently updated dogs
    const minHeap = new MinHeap<PetDto>((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

    for (const dog of dogs) {
      minHeap.push(dog);
      if (minHeap.size() > n) {
        minHeap.pop(); // Keep only top `n` most recent
      }
    }

    const nthMostRecentDog = minHeap.peek();
    console.log(`What is the name of the 3rd most recently updated dog? ${nthMostRecentDog?.name || "N/A"}`);
  } catch (error) {
    console.error(`Error fetching the ${n}th most recently updated dog:`, error.message);
  }
};
*/



(async () => {
  await printTotalCounts();
  await countOlderCats();
  await totalCostOfBirds();
  await averageAgeOfCheapPets();
  //await fetchNthMostRecentDog(3);
})();

// Simple Min Heap implementation
class MinHeap<T> {
  private heap: T[];
  private comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.heap = [];
    this.comparator = comparator;
  }

  size() {
    return this.heap.length;
  }

  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  push(value: T) {
    this.heap.push(value);
    this.bubbleUp();
  }

  pop(): T | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop() || null;

    const top = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown();
    return top;
  }

  private bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown() {
    let index = 0;
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}
