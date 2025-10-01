const IVideos = require("../domain/IVideos");

class IVideosRepository extends IVideos {
    constructor() {
        super();
        this.videos = []; // Este array sera temporal, hasta usar una base de datos
    }

    async getAllVideos() {
        return this.videos;
    }
    
    async getVideoById(id) {
        return this.videos.find(v => v.id === id) || null;
    }   
    
    async addVideo(video) {
        this.videos.push(video);
        return video;
    }
    
    async deleteVideo(id) {
        const index = this.videos.findIndex(v => v.id === id);
        if (index !== -1) {
            return this.videos.splice(index, 1)[0];
        }
        return null;
    }
    
    async updateVideo(id, videoData) {
        const index = this.videos.findIndex(v => v.id === id);
        if (index !== -1) {
            this.videos[index] = { ...this.videos[index], ...videoData };
            return this.videos[index];
        }
        return null;
    }
}

module.exports = IVideosRepository;