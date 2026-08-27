import { z } from 'zod';
import type { Request } from 'express';
import { ApiException } from './http-error';
import {
  BranchModel,
  CityModel,
  CountryModel,
  StateModel,
} from './models-business';
import { namedId, parseObjectId, tenantObjectId } from './scope';

const nameSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(12).optional(),
});

export async function locationTree(req: Request) {
  const tenantId = tenantObjectId(req);
  const [countries, states, cities, branches] = await Promise.all([
    CountryModel.find({ tenantId }).sort({ name: 1 }).lean().exec(),
    StateModel.find({ tenantId }).sort({ name: 1 }).lean().exec(),
    CityModel.find({ tenantId }).sort({ name: 1 }).lean().exec(),
    BranchModel.find({ tenantId }).sort({ name: 1 }).lean().exec(),
  ]);

  return countries.map((country) => ({
    id: String(country._id),
    name: country.name,
    code: country.code,
    status: country.status,
    states: states
      .filter((state) => String(state.countryId) === String(country._id))
      .map((state) => ({
        id: String(state._id),
        name: state.name,
        code: state.code,
        status: state.status,
        cities: cities
          .filter((city) => String(city.stateId) === String(state._id))
          .map((city) => ({
            id: String(city._id),
            name: city.name,
            status: city.status,
            branches: branches
              .filter((branch) => String(branch.cityId) === String(city._id))
              .map((branch) => ({
                id: String(branch._id),
                name: branch.name,
                code: branch.code,
                address: branch.address,
                status: branch.status,
              })),
          })),
      })),
  }));
}

export async function listCountries(req: Request) {
  const countries = await CountryModel.find({ tenantId: tenantObjectId(req) })
    .sort({ name: 1 })
    .lean()
    .exec();
  return countries.map((country) => ({
    id: String(country._id),
    name: country.name,
    code: country.code,
    status: country.status,
  }));
}

export async function createCountry(req: Request) {
  const parsed = nameSchema
    .extend({ code: z.string().trim().min(2).max(12) })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  try {
    const country = await CountryModel.create({
      tenantId: tenantObjectId(req),
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      status: 'ACTIVE',
    });
    return { id: String(country._id), name: country.name, code: country.code, status: country.status };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'location.country_exists');
    }
    throw error;
  }
}

export async function listStates(req: Request) {
  const countryId = req.query.countryId ? parseObjectId(String(req.query.countryId), 'countryId') : undefined;
  const states = await StateModel.find({
    tenantId: tenantObjectId(req),
    ...(countryId ? { countryId } : {}),
  })
    .sort({ name: 1 })
    .lean()
    .exec();
  return states.map((state) => ({
    id: String(state._id),
    countryId: String(state.countryId),
    name: state.name,
    code: state.code,
    status: state.status,
  }));
}

export async function createState(req: Request) {
  const parsed = z
    .object({
      countryId: z.string().min(1),
      name: z.string().trim().min(2).max(80),
      code: z.string().trim().min(2).max(12),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const country = await CountryModel.findOne({
    _id: parseObjectId(parsed.data.countryId, 'countryId'),
    tenantId,
  }).exec();
  if (!country) {
    throw new ApiException(404, 'location.country_not_found');
  }
  try {
    const state = await StateModel.create({
      tenantId,
      countryId: country._id,
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      status: 'ACTIVE',
    });
    return {
      id: String(state._id),
      countryId: String(state.countryId),
      name: state.name,
      code: state.code,
      status: state.status,
    };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'location.state_exists');
    }
    throw error;
  }
}

export async function listCities(req: Request) {
  const stateId = req.query.stateId ? parseObjectId(String(req.query.stateId), 'stateId') : undefined;
  const cities = await CityModel.find({
    tenantId: tenantObjectId(req),
    ...(stateId ? { stateId } : {}),
  })
    .sort({ name: 1 })
    .lean()
    .exec();
  return cities.map((city) => ({
    id: String(city._id),
    stateId: String(city.stateId),
    name: city.name,
    status: city.status,
  }));
}

export async function createCity(req: Request) {
  const parsed = z
    .object({
      stateId: z.string().min(1),
      name: z.string().trim().min(2).max(80),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const state = await StateModel.findOne({
    _id: parseObjectId(parsed.data.stateId, 'stateId'),
    tenantId,
  }).exec();
  if (!state) {
    throw new ApiException(404, 'location.state_not_found');
  }
  try {
    const city = await CityModel.create({
      tenantId,
      stateId: state._id,
      name: parsed.data.name,
      status: 'ACTIVE',
    });
    return { id: String(city._id), stateId: String(city.stateId), name: city.name, status: city.status };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'location.city_exists');
    }
    throw error;
  }
}

export async function listBranches(req: Request) {
  const tenantId = tenantObjectId(req);
  const cityId = req.query.cityId ? parseObjectId(String(req.query.cityId), 'cityId') : undefined;
  const branches = await BranchModel.find({
    tenantId,
    ...(cityId ? { cityId } : {}),
  })
    .sort({ name: 1 })
    .lean()
    .exec();
  const cities = await CityModel.find({ tenantId }).lean().exec();
  const states = await StateModel.find({ tenantId }).lean().exec();
  const countries = await CountryModel.find({ tenantId }).lean().exec();
  const cityMap = new Map(cities.map((city) => [String(city._id), city]));
  const stateMap = new Map(states.map((state) => [String(state._id), state]));
  const countryMap = new Map(countries.map((country) => [String(country._id), country]));

  return branches.map((branch) => {
    const city = cityMap.get(String(branch.cityId));
    const state = city ? stateMap.get(String(city.stateId)) : undefined;
    const country = state ? countryMap.get(String(state.countryId)) : undefined;
    return {
      id: String(branch._id),
      name: branch.name,
      code: branch.code,
      address: branch.address,
      status: branch.status,
      city: namedId(city),
      state: namedId(state),
      country: namedId(country),
    };
  });
}

export async function createBranch(req: Request) {
  const parsed = z
    .object({
      cityId: z.string().min(1),
      name: z.string().trim().min(2).max(80),
      code: z.string().trim().min(2).max(12),
      address: z.string().trim().max(200).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const city = await CityModel.findOne({
    _id: parseObjectId(parsed.data.cityId, 'cityId'),
    tenantId,
  }).exec();
  if (!city) {
    throw new ApiException(404, 'location.city_not_found');
  }
  try {
    const branch = await BranchModel.create({
      tenantId,
      cityId: city._id,
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      address: parsed.data.address ?? '',
      status: 'ACTIVE',
    });
    return {
      id: String(branch._id),
      name: branch.name,
      code: branch.code,
      address: branch.address,
      status: branch.status,
      cityId: String(branch.cityId),
    };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'branch.code_exists');
    }
    throw error;
  }
}

function isDuplicate(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
