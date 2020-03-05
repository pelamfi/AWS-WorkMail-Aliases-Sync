import { AliasesFileUsers, aliasesPerUser } from '../src/AliasesFile';

describe('Converting aliases file data', () => {
  it('accepts empty data', () => {
    expect(aliasesPerUser([])).toStrictEqual({ users: [] } as AliasesFileUsers);
  });

  it('accepts simple data', () => {
    expect(
      aliasesPerUser([{ alias: 'aliasfoo', localEmails: ['localfoo'] }]),
    ).toStrictEqual({
      users: [{ localEmail: 'localfoo', aliases: ['aliasfoo'] }],
    } as AliasesFileUsers);
  });

  it('correctly "transposes" a bit more complex data with 2 simple aliases', () => {
    expect(
      aliasesPerUser([
        { alias: 'aliasbar', localEmails: ['localbar'] },
        { alias: 'aliasfoo', localEmails: ['localfoo'] },
      ]),
    ).toStrictEqual({
      users: [
        { localEmail: 'localbar', aliases: ['aliasbar'] },
        { localEmail: 'localfoo', aliases: ['aliasfoo'] },
      ],
    } as AliasesFileUsers);
  });

  it('correctly "transposes" a bit more complex data with 2 recipients', () => {
    expect(
      aliasesPerUser([
        { alias: 'aliasfoo', localEmails: ['localbar', 'localfoo'] },
      ]),
    ).toStrictEqual({
      users: [
        { localEmail: 'localbar', aliases: ['aliasfoo'] },
        { localEmail: 'localfoo', aliases: ['aliasfoo'] },
      ],
    } as AliasesFileUsers);
  });

  it('correctly "transposes" 2 recipients', () => {
    expect(
      aliasesPerUser([
        { alias: 'aliasfoo', localEmails: ['localbar', 'localfoo'] },
      ]),
    ).toStrictEqual({
      users: [
        { localEmail: 'localbar', aliases: ['aliasfoo'] },
        { localEmail: 'localfoo', aliases: ['aliasfoo'] },
      ],
    } as AliasesFileUsers);
  });

  it('correctly "transposes" even more complex data', () => {
    const aliases = [
      { alias: 'aliasfoo', localEmails: ['localbar', 'localbaz', 'localfoo'] },
      { alias: 'aliasbar', localEmails: ['localbar', 'localfoo'] },
    ];
    const perUser = aliasesPerUser(aliases);
    expect(perUser).toHaveProperty('users');
    expect(perUser.users).toHaveLength(3);
    expect(perUser.users[0]).toStrictEqual({
      localEmail: 'localbar',
      aliases: ['aliasbar', 'aliasfoo'],
    });
    expect(perUser.users[1]).toStrictEqual({
      localEmail: 'localbaz',
      aliases: ['aliasfoo'],
    });
    expect(perUser.users[2]).toStrictEqual({
      localEmail: 'localfoo',
      aliases: ['aliasbar', 'aliasfoo'],
    });
  });
});
