const db = require('../../../database/models');
const { Location } = require('../../../database/models')

class LocationService {
  async createLocation(locationData) {
    if (!locationData.imageUrl) {
      throw new Error('Image URL is required');
    }

    const newLocation = await db.Location.create({
      name: locationData.name,
      description: locationData.description,
      latitude: parseFloat(locationData.latitude),
      longitude: parseFloat(locationData.longitude),
      imageUrl: locationData.imageUrl,
      uploaderId: locationData.uploaderId
    });
    

    return newLocation;
  }
  async getLocations() {
      const locations = await Location.findAll({
        include: [{
          model: db.User,
          as: 'uploader',
          attributes: ['id', 'name', 'userName', 'role']
        }]
      }); 
      return locations;
    }
  }

module.exports = new LocationService();