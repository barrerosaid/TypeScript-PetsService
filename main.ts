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

//ADDED Functions for Printing Results:

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

// Function to get the 3rd most recently updated dog using a Min Heap (Priority Queue)
const fetchNthMostRecentDog = async (n: number) => {
  try {
    const response = await axios.get<{ data: PetDto[] }>(`${PET_STORE_URL_PET_API_V1}?type[eq]=Dog`);
    const dogs = response.data.data;

    if (dogs.length < n) {
      console.log(`There are less than ${n} dogs in the pet shop.`);
      return;
    }

    // Min Heap to track top `n` most recently updated dogs
    const minHeap = new MinHeap<PetDto>((a, b) => new Date(a.updatedAt.toString()).getTime() - new Date(b.updatedAt.toString()).getTime());

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



(async () => {
  await printTotalCounts();
  await countOlderCats();
  await totalCostOfBirds();
  await averageAgeOfCheapPets();
  await fetchNthMostRecentDog(3);
})();

/*
ADDED: Min Heap Inner Class Based On Email Conversations/Guidelines

NOTE: Attempted to Use libraries but struggled to get imports to work in the container properly
//import { MinPriorityQueue } from '@datastructures-js/priority-queue';
//import { MinHeap } from 'heap-js';

Decided to use inspiration from: https://github.com/topics/min-heap?l=typescript
to write a basic simple min heap implementation in TypeScript

*/
class MinHeap<T> {
  private heap: T[]; // Array to store heap elements
  private comparator: (a: T, b: T) => number; // Function to determine priority

  /**
   * Constructor initializes an empty heap with a comparator function.
   * @param comparator - Function to compare two elements.
   */
  constructor(comparator: (a: T, b: T) => number) {
    this.heap = [];
    this.comparator = comparator;
  }

  /**
   * Returns the number of elements in the heap.
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Returns the smallest element in the heap without removing it.
   * If the heap is empty, returns null.
   */
  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Adds a new element to the heap and maintains the heap property.
   * @param value - The element to be added.
   */
  push(value: T): void {
    this.heap.push(value); // Add the new element to the end
    this.heapifyUp(); // Restore the heap property
  }

  /**
   * Removes and returns the smallest element from the heap.
   * If the heap is empty, returns null.
   */
  pop(): T | null {
    if (this.heap.length === 0) return null; // Heap is empty
    if (this.heap.length === 1) return this.heap.pop() || null; // Only one element

    // Swap the first and last elements, then remove the last (smallest)
    const top = this.heap[0];
    this.heap[0] = this.heap.pop()!; // Move the last element to the top
    this.heapifyDown(); // Restore the heap property
    return top;
  }

  /**
   * Moves the last inserted element up to its correct position.
   */
  private heapifyUp(): void {
    let index = this.heap.length - 1; // Start at the last element

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2); // Find parent index

      // If the current element is not smaller than its parent, stop
      if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) break;

      // Swap with the parent
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex; // Move up to the parent
    }
  }

  /**
   * Moves the root element down to its correct position.
   */
  private heapifyDown(): void {
    let index = 0; // Start at the root
    const length = this.heap.length;

    while (true) {
      const left = 2 * index + 1; // Left child index
      const right = 2 * index + 2; // Right child index
      let smallest = index; // Assume the current node is the smallest

      // Check if left child exists and is smaller
      if (left < length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }

      // Check if right child exists and is smaller than the current smallest
      if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      // If the smallest is still the parent, we are done
      if (smallest === index) break;

      // Swap the parent with the smallest child
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest; // Move down to the new position
    }
  }
}
