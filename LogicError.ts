/**
 * LogicError
 * @format
 * @description 异常处理
 */

interface ErrorBody {
  code: number;
  msg: string;
  chmsg: string;
}

function formatErrorMsg(msg: string, params: string[]) {
  let index = 0;
  return msg.replace(/\{\}/g, () => {
    return params[index++];
  });
}

export default class LogicError extends Error {
  data: any;
  constructor(code: number, msg: string, data: any) {
    super(`code ${code} message: ${msg}`);
    this.data = data;
  }

  static FromError(body: ErrorBody, ...params: string[]) {
    const { code, msg, chmsg } = body;
    return {
      code,
      msg: formatErrorMsg(msg, params),
      chmsg: formatErrorMsg(chmsg, params),
    };
  }

  static FromOK(data?: any) {
    return {
      code: 0,
      msg: 'success',
      chmsg: '成功',
      data,
    };
  }
}
