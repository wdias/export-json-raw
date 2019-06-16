const queryParam = (name: string, value: string) => {
    return value ? `&${name}=${value}`: '';
}

export default {
    queryParam,
};
