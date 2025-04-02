import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import CreatePetDto from './dtos/create-pet.dto';
import PetListWithCounts from './dtos/pet-list.dto';
import PetDto from './dtos/pet.dto';
import UpdatePetDto from './dtos/update-pet.dto';
import { Pet } from './schemas/pet.schema';

// DO NOT EDIT THIS VALUE, yes it could be larger or smaller, but it's here to force certain conditions
const MAX_LIMIT = 100;

export type PetQueryFilter = {
  gt: string;
  gte: string;
  lt: string;
  lte: string;
  eq: string;
};

@Injectable()
export class PetService {
  constructor(@InjectModel(Pet.name) private petModel: Model<Pet>) {}

  /*
    Helper function to convert passed query into mongoose filter object
  */
  private parseFilterStringToFilterQuery(filter: PetQueryFilter): { $eq?: number; $gt?: number; $lt?: number } {
    //ADDED: gte and lte
    const allowedOperators = ['eq', 'gt', 'lt','gte','lte'];
    const filterObj: any = {};
    if (!filter) {
      return filterObj;
    }
    allowedOperators.forEach((operator) => {
      if (filter[operator] !== undefined) {
        // convert it into the mongoose filter style (e.g. age equals 5 is "age: {$eq: 5}")
        //ADDED: Convert to number
        const value = isNaN(Number(filter[operator])) ? filter[operator] : Number(filter[operator]);
        filterObj['$' + operator] = value;
      }
    });
    return filterObj;
  }

  async list(
    filter: { age: PetQueryFilter; cost: PetQueryFilter; type: PetQueryFilter; name: PetQueryFilter },
    offset: number,
    limit: number,
    sort: string,
  ): Promise<PetListWithCounts> {
    if (limit == undefined || limit < 1) {
      limit = MAX_LIMIT;
    }
    limit = Math.min(limit, MAX_LIMIT);

    const findFilter: FilterQuery<Pet> = {};

    // apply age filter to find filter
    const ageFilter = this.parseFilterStringToFilterQuery(filter.age);
    if (Object.keys(ageFilter).length > 0) {
      findFilter.age = ageFilter;
    }

    // apply name filter to find filter
    const nameFilter = this.parseFilterStringToFilterQuery(filter.name);
    if (Object.keys(nameFilter).length > 0) {
      findFilter.name = nameFilter;
    }

    // ADDED: type filter to apply to find filter:
    const typeFilter = this.parseFilterStringToFilterQuery(filter.type);
    if(Object.keys(typeFilter).length >0){
      findFilter.type = typeFilter;
    }

    // ADDED: cost filter to apply to find filter:
    const costFilter = this.parseFilterStringToFilterQuery(filter.cost);
    if(Object.keys(costFilter).length >0){
      findFilter.cost = costFilter;
    }

    // when executed, this query should represent the total number of documents in the collection
    const totalCountQuery = this.petModel.countDocuments();

    // when executed, this query should represent the total number of documents that match the passed filter
    const filteredCountQuery = this.petModel.countDocuments(findFilter);

    // when executed, this query should return documents that match the passed filter while respecting the offset and limit (pagination)
    const findQuery = this.petModel.find(findFilter);

    // apply offset
    findQuery.skip(offset);

    // apply limit
    findQuery.limit(limit);

    // TODO: apply sorting to cost, age, name, and type fields.
    // DO NOT provide or allow sorting for createdAt or updatedAt.
    // ran out of time here, need to apply sorting based on passed in value with the above restriction
    // format: +key
    //  +/- => asc/desc
    //  key => sortable field

    // ADDED: sorted fields that can be used
    const allowedSortFields = ['cost', 'age','name','type'];

    if(sort){
      // ADDED: eg order: +/-
      const order = sort.charAt(0);
      // ADDED: eg key: 'cost','age'
      const key = sort.slice(1);

      if (key === 'updatedAt' || key === 'createdAt') {
        throw new BadRequestException('Sorting with this key is not allowed.');
      }
      
      // ADDED: if order is '-' then desc otherwise it should be asc
      const sortOrder = (order === '-') ? 'desc' : 'asc';
      
      // ADDED: Ensure only one sorting criteria is applied
      findQuery.sort({ [key]: sortOrder });
    }

    // execute the queries and then return the counts and data
    return Promise.all([totalCountQuery.exec(), filteredCountQuery.exec(), findQuery.exec()]).then((results) => {
      return {
        totalCount: results[0],
        filteredCount: results[1],
        data: results[2].map((entity) => {
          return entity.toDto();
        }),
      };
    });
  }

  async create(createPetDto: CreatePetDto): Promise<PetDto> {
    return this.petModel.create(createPetDto).then((pet) => {
      // Convert it into a DTO so we don't return the db entity
      return pet.toDto();
    });
  }

  async update(petId: string, updatePetDto: UpdatePetDto): Promise<PetDto> {
    return this.petModel.findByIdAndUpdate(petId, updatePetDto, { new: true }).then((pet) => {
      if (!pet) {
        throw new NotFoundException();
      }
      // Convert it into a DTO so we don't return the db entity
      return pet.toDto();
    });
  }

  // ADDED: Delete function following example for Update and using provided DTO and mongoose findByIdAndDelete function
  async delete(petId: string) : Promise<PetDto> {
    return this.petModel.findByIdAndDelete(petId).then((pet) => {
      if(!pet){
        return;
      }
      return pet.toDto();
    });

  }
}
