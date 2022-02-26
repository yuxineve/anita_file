export default class Screen extends Service {
    public async getScreenVersionList() {
        const body = Object.assign({}, this.ctx.request.body, { operator: this.ctx.session.userID });
        const [error, result] = await errorCaptured(
        rq({
            url: `${this.app.config.yaml.serviceDomain}/api/screen/version/list`,
            body: { ...body, versionId: parseInt(body.versionId, 10) },
        }),
        );
        console.info(error, result);
        if (error || !!result.retCode || !result.response) {
        this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_VERSION_ERROR);
        return;
        }
        this.ctx.body = LogicError.FromOK(result.response);
    }
}